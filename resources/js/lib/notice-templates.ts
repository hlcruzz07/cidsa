export const NOTICE_TEMPLATES = [
    {
        group: 'Picture',
        items: [
            {
                label: 'Eyeglasses',
                message:
                    'Your ID picture shows you wearing eyeglasses. Please upload a new picture without eyeglasses, facing the camera, then wait for your ID to be processed.',
            },
            {
                label: 'Blurry / dark',
                message:
                    'Your ID picture is blurry or too dark. Please upload a clear, well-lit photo with a plain background.',
            },
            {
                label: 'Not compliant',
                message:
                    'Your picture does not meet the ID requirements (no filters, no cap, no sunglasses, face fully visible). Please upload a new one.',
            },
            {
                label: 'Busy background',
                message:
                    'Your picture has a busy background. Please retake it against a plain white or light-colored wall.',
            },
        ],
    },
    {
        group: 'E-signature',
        items: [
            {
                label: 'Missing',
                message:
                    'Your e-signature is missing. Please upload your signature on white paper using a black or blue pen.',
            },
            {
                label: 'Unclear',
                message:
                    'Your e-signature is unclear or cut off. Please sign again on plain white paper and upload a clean, complete image.',
            },
            {
                label: 'Not handwritten',
                message:
                    'The signature you uploaded does not look like a handwritten signature. Please upload a photo of your actual signature.',
            },
        ],
    },
    {
        group: 'Attire',
        items: [
            {
                label: 'Dress code',
                message:
                    'Your attire does not follow the ID dress code (sleeveless or collarless top). Please retake your picture in a collared shirt, blouse, or the prescribed uniform.',
            },
            {
                label: 'Uniform required',
                message:
                    'Please wear the prescribed uniform or formal attire in your ID picture. Retake and upload a new photo.',
            },
        ],
    },
    {
        group: 'Information',
        items: [
            {
                label: 'Name mismatch',
                message:
                    "Your name on the form does not match your enrollment record. Please check your details and report to the registrar's office if they are wrong.",
            },
            {
                label: 'Program / year',
                message:
                    'Your program or year level appears incorrect. Please verify it with your department and update your record.',
            },
            {
                label: 'Incomplete ID no.',
                message:
                    'Your student ID number appears incomplete. Please recheck it and update your record.',
            },
        ],
    },
    {
        group: 'General',
        items: [
            {
                label: 'Visit office',
                message:
                    'There is a problem with your ID details. Please visit the ID processing office with your registration form so we can fix it before printing.',
            },
            {
                label: 'Update in 3 days',
                message:
                    'Please update your ID information within 3 days to avoid delays in printing.',
            },
        ],
    },
] as const;
