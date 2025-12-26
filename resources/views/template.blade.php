<table>
    <thead>
        <tr>
            <th>RecordID</th>
            <th>Field1</th>
            <th>Field2</th>
            <th>Field3</th>
            <th>Field4</th>
            <th>Field5</th>
            <th>Field6</th>
            <th>Field7</th>
            <th>Field8</th>
            <th>Field9</th>
            <th>Field10</th>
            <th>Field11</th>
            <th>Field12</th>
            <th>Field13</th>
            <th>Field14</th>
            <th>Field15</th>
            <th>Field16</th>
            <th>CardColour</th>
            <th>DateCreated</th>
            <th>CardLayout</th>
            <th>PrintFlag</th>
            <th>Reprint</th>
            <th>LastPrinted</th>
            <th>Field17</th>
            <th>Blank</th>
            <th>ExternalLink</th>
            <th>Dup</th>
            <th>ExcludeFlag</th>
        </tr>
    </thead>
    <tbody>
        @foreach($students as $student)
            <tr>
                <td></td>
                <td>{{ $student['program'] }}</td>
                <td>{{ strtoupper($student['first_name']) . ($student['middle_init'] ? ' '.strtoupper($student['middle_init']) : '') . strtoupper($student['last_name']) }} {{ $student['suffix'] ? strtoupper($student['suffix']) : '' }}</td>
                <td>{{ $student['id_number'] }}</td>
                <td></td>
                <td>{{ $student['college'] }}</td>
                <td></td>
                <td></td>
                 <td>{{ strtoupper($student['emergency_first_name']) . ($student['emergency_middle_init'] ? ' '.strtoupper($student['emergency_middle_init']) : '') . strtoupper($student['emergency_last_name']) }} {{ $student['emergency_suffix'] ? strtoupper($student['emergency_suffix']) : '' }}</td>
                <td>{{ $student['barangay'] }}, {{ $student['city'] }}, {{ $student['zip_code'] }}</td>
                <td>0{{ substr($student['contact_number'], 0,3) }}-{{ substr($student['contact_number'], 3) }}</td>
                <td>{{ $student['province'] }}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>{{ $student['first_name'] }}</td>
                <td>{{ $student['last_name'] }}</td>
                <td></td>
                <td>STUDENT_ID_TALISAY</td>
                <td></td>
                <td></td>
                <td></td>
                <td>{{ $student['middle_init'] ? strtoupper($student['middle_init']) : '' }}</td>
                <td></td>
                <td></td>
                <td></td>
                <td>0</td>
            </tr>
        @endforeach
    </tbody>
</table>
