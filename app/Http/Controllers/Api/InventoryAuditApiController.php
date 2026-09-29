<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserCampus;
use App\Http\Controllers\Controller;
use App\Models\InventoryStock;
use App\Services\InventoryAudit;
use App\Services\InventoryBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\Element\Section;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Settings;
use App\Services\InventoryLedger;
class InventoryAuditApiController extends Controller
{
    /** Audit summary for the modal. */
    public function show(Request $request, InventoryStock $stock)
    {
        $this->authorizeAudit($request, $stock);

        return response()->json(InventoryAudit::forStock($stock));
    }

    /** Same audit as a downloadable Word document. */
    public function docx(Request $request, InventoryStock $stock)
    {
        $this->authorizeAudit($request, $stock);

        $audit = InventoryAudit::forStock($stock);

        Settings::setOutputEscapingEnabled(true);

        $word = new PhpWord();
        $word->setDefaultFontName('Calibri');
        $word->setDefaultFontSize(10);

        $section = $word->addSection([
            'marginTop' => 1000,
            'marginBottom' => 1000,
            'marginLeft' => 1200,
            'marginRight' => 1200,
        ]);

        $fmtDate = fn(?string $iso, string $format = 'M j, Y g:i A') => $iso ? Carbon::parse($iso)->format($format) : '—';
        $n = fn($v) => number_format((int) $v);

        // ── Header ───────────────────────────────────────────────────────────
        $section->addText('Inventory Audit Report', ['bold' => true, 'size' => 20]);
        $section->addText($audit['campus'] . ' Campus', ['size' => 13, 'color' => '555555']);
        $section->addText(
            'Generated ' . $fmtDate($audit['generated_at']) . ' by ' . ($request->user()->name ?? 'Unknown'),
            ['size' => 9, 'color' => '777777'],
        );
        $section->addTextBreak();

        $resultMap = [
            'fail' => ['FAILED: discrepancies need attention', 'C00000'],
            'warning' => ['PASSED WITH WARNINGS', 'B45309'],
            'pass' => ['PASSED: records are consistent', '15803D'],
        ];
        [$resultText, $resultColor] = $resultMap[$audit['result']];
        $section->addText('Result: ' . $resultText, ['bold' => true, 'size' => 12, 'color' => $resultColor]);

        // ── Summary ──────────────────────────────────────────────────────────
        $t = $audit['totals'];
        $section->addTextBreak();
        $section->addText('Summary', ['bold' => true, 'size' => 13]);
        $this->table($section, ['Item', 'Value'], [
            ['Confirmed cards received', $n($t['received'])],
            ['IDs printed (activity log)', $n($t['printed'])],
            ['Current balance (received − printed)', $n($t['balance'])],
            ['Printed beyond confirmed stock', $t['discrepancy'] > 0 ? $n($t['discrepancy']) : 'None'],
            ['Pending (unconfirmed) cards', $n($t['pending_quantity']) . ' in ' . $n($t['pending_count']) . ' receipt(s)'],
            ['Balance if all pending are confirmed', $n($t['projected_balance'])],
            ['Prints made with no confirmed stock', $n($audit['ledger']['unbacked_prints'])],
            ['First delivery confirmed', $fmtDate($audit['period']['first_receipt'], 'M j, Y')],
            ['First / last print', $fmtDate($audit['period']['first_print'], 'M j, Y') . ' / ' . $fmtDate($audit['period']['last_print'], 'M j, Y')],
        ], [5200, 3600]);

        // ── Findings ─────────────────────────────────────────────────────────
        $section->addTextBreak();
        $section->addText('Findings', ['bold' => true, 'size' => 13]);
        $colors = ['critical' => 'C00000', 'warning' => 'B45309', 'info' => '1D4ED8'];
        foreach ($audit['findings'] as $f) {
            $section->addText(
                '[' . strtoupper($f['severity']) . '] ' . $f['title'],
                ['bold' => true, 'color' => $colors[$f['severity']]],
            );
            $section->addText($f['detail'], ['size' => 9.5]);
        }

        // ── Deliveries ───────────────────────────────────────────────────────
        $receiptRows = fn(array $list) => array_map(fn($r) => [
            $r['ref_no'],
            $fmtDate($r['sent_at'], 'M j, Y'),
            $fmtDate($r['received_at'], 'M j, Y'),
            $n($r['quantity']),
            $r['delivered_by'] ?? '—',
            $r['received_by'] ?? '—',
        ], $list);

        $headers = ['Reference No.', 'Sent', 'Received', 'Qty', 'Delivered By', 'Received By'];
        $widths = [1900, 1200, 1200, 700, 1900, 1900];

        $section->addTextBreak();
        $section->addText('Confirmed Deliveries', ['bold' => true, 'size' => 13]);
        $this->table($section, $headers, $receiptRows($audit['receipts']['confirmed']), $widths);

        $section->addTextBreak();
        $section->addText('Pending Deliveries', ['bold' => true, 'size' => 13]);
        $this->table($section, $headers, $receiptRows($audit['receipts']['pending']), $widths);

        // ── Print breakdowns ─────────────────────────────────────────────────
        $section->addTextBreak();
        $section->addText('Prints by Type', ['bold' => true, 'size' => 13]);
        $this->table(
            $section,
            ['Print type', 'Count'],
            array_map(fn($r) => [$r['label'], $n($r['count'])], $audit['prints_by_type']),
            [5200, 3600],
        );

        $section->addTextBreak();
        $section->addText('Prints by User (top 10)', ['bold' => true, 'size' => 13]);
        $this->table(
            $section,
            ['User', 'Count'],
            array_map(fn($r) => [$r['label'], $n($r['count'])], $audit['prints_by_user']),
            [5200, 3600],
        );

        $section->addTextBreak();
        $section->addText('Monthly Movement (last 12 months)', ['bold' => true, 'size' => 13]);
        $this->table(
            $section,
            ['Month', 'Received', 'Printed', 'Running balance'],
            array_map(fn($r) => [$r['month'], $n($r['received']), $n($r['printed']), $n($r['balance'])], $audit['monthly']),
            [2600, 2000, 2000, 2200],
        );

        // ── Sign-off ─────────────────────────────────────────────────────────
        $section->addTextBreak(2);
        $section->addText('Prepared by: ______________________    Date: ______________');
        $section->addTextBreak();
        $section->addText('Verified by: ______________________    Date: ______________');

        $filename = sprintf(
            'inventory-audit-%s-%s.docx',
            Str::slug($audit['campus']),
            now()->format('Ymd-His'),
        );

        return response()->streamDownload(
            fn() => IOFactory::createWriter($word, 'Word2007')->save('php://output'),
            $filename,
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        );
    }

    /**
     * Super admins (campus ALL) may audit any campus; everyone else only their own.
     */
    private function authorizeAudit(Request $request, InventoryStock $stock): void
    {
        $mine = InventoryBalance::campusKey($request->user()->campus);

        abort_unless(
            $mine === UserCampus::ALL->value
            || $mine === InventoryBalance::campusKey($stock->campus),
            403,
            'You can only audit your own campus.',
        );
    }

    private function table(Section $section, array $headers, array $rows, array $widths): void
    {
        $table = $section->addTable([
            'borderSize' => 6,
            'borderColor' => 'BBBBBB',
            'cellMargin' => 60,
        ]);

        $table->addRow();
        foreach ($headers as $i => $h) {
            $table->addCell($widths[$i], ['bgColor' => 'EEEEEE'])
                ->addText($h, ['bold' => true, 'size' => 9]);
        }

        foreach ($rows as $row) {
            $table->addRow();
            foreach ($row as $i => $value) {
                $table->addCell($widths[$i])->addText((string) $value, ['size' => 9]);
            }
        }

        if (empty($rows)) {
            $table->addRow();
            $table->addCell(array_sum($widths), ['gridSpan' => count($headers)])
                ->addText('None', ['italic' => true, 'size' => 9]);
        }
    }

    public function ledger(Request $request, InventoryStock $stock)
    {
        $this->authorizeAudit($request, $stock);

        $all = InventoryLedger::forStock($stock);
        $entries = $all->reverse()->values(); // newest first

        $perPage = min(max((int) $request->integer('per_page', 15), 5), 100);
        $page = max((int) $request->integer('page', 1), 1);

        return response()->json([
            'campus' => $stock->campus,
            'balance' => (int) ($all->last()['balance'] ?? 0),
            'received' => (int) $all->where('type', 'received')->sum('quantity'),
            'printed' => $all->where('type', 'printed')->count(),
            'total' => $entries->count(),
            'page' => $page,
            'last_page' => max(1, (int) ceil($entries->count() / $perPage)),
            'data' => $entries->forPage($page, $perPage)->values(),
        ]);
    }
}