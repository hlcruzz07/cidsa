type CampusData = {
    campus: string;
    colleges: {
        value: string;
        name: string;
        programs: {
            name: string;
            majors: string[];
        }[];
    }[];
};
export const campusDirectoryArr: CampusData[] = [
    {
        campus: 'Talisay',
        colleges: [
            {
                value: 'CAS',
                name: 'College of Arts & Sciences',
                programs: [
                    {
                        name: 'Bachelor of Arts in English Language',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Arts in Social Science',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Public Administration',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Applied Mathematics',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Psychology',
                        majors: [],
                    },
                    {
                        name: 'Master in Public Administration',
                        majors: [
                            'Human Resource Management',
                            'Urban Planning and Management',
                        ],
                    },
                    {
                        name: 'Doctor in Public Administration',
                        majors: ['Professional Track'],
                    },
                ],
            },
            {
                value: 'CBMA',
                name: 'College of Business Management & Accountancy',
                programs: [
                    {
                        name: 'Bachelor of Science in Hospitality Management',
                        majors: [],
                    },
                ],
            },
            {
                value: 'CCS',
                name: 'College of Computer Studies',
                programs: [
                    {
                        name: 'Bachelor of Science in Information Systems',
                        majors: [],
                    },
                ],
            },
            {
                value: 'COED',
                name: 'College of Education',
                programs: [
                    {
                        name: 'Bachelor of Early Childhood Education',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Elementary Education',
                        majors: ['General Education'],
                    },
                    { name: 'Bachelor of Physical Education', majors: [] },
                    {
                        name: 'Bachelor of Secondary Education',
                        majors: [
                            'English',
                            'Filipino',
                            'Mathematics',
                            'Science',
                        ],
                    },
                    {
                        name: 'Bachelor of Special Needs Education',
                        majors: ['Generalist'],
                    },
                    {
                        name: 'Bachelor of Technology and Livelihood Education',
                        majors: ['Home Economics', 'Industrial'],
                    },
                    {
                        name: 'Teacher Certificate Program (Supplementals)',
                        majors: [],
                    },
                    {
                        name: 'Master of Arts in Education',
                        majors: ['Educational Management'],
                    },
                    {
                        name: 'Master of Arts in Education (Academic Track)',
                        majors: [
                            'Educational Management',
                            'English',
                            'General Science',
                            'Mathematics',
                            'Physical Education',
                            'Technology and Livelihood Education',
                        ],
                    },
                    {
                        name: 'Doctor of Education',
                        majors: ['Educational Management'],
                    },
                ],
            },
            {
                value: 'COE',
                name: 'College of Engineering',
                programs: [
                    {
                        name: 'Bachelor of Science in Civil Engineering',
                        majors: [],
                    },
                ],
            },
            {
                value: 'CIT',
                name: 'College of Industrial Technology',
                programs: [
                    {
                        name: 'Bachelor of Industrial Technology',
                        majors: [
                            'Apparel & Fashion Technology',
                            'Architectural Drafting Technology',
                            'Automotive Technology',
                            'Culinary Technology',
                            'Electrical Technology',
                            'Electronics Technology',
                            'HVACR Technology',
                            'Mechanical Technology',
                        ],
                    },
                    {
                        name: 'Bachelor of Science in Industrial Technology',
                        majors: [
                            'Apparel & Fashion Technology',
                            'Architectural Drafting Technology',
                            'Automotive Technology',
                            'Culinary Technology',
                            'Electrical Technology',
                            'Electronics Technology',
                            'HVACR Technology',
                            'Mechanical Technology',
                        ],
                    },
                    { name: 'Master in Technology Management', majors: [] },
                    {
                        name: 'Doctor in Philosophy in Technology Management',
                        majors: [],
                    },
                ],
            },
        ],
    },

    {
        campus: 'Binalbagan',
        colleges: [
            {
                value: 'CBMA',
                name: 'College of Business Management & Accountancy',
                programs: [
                    {
                        name: 'Bachelor of Science in Hospitality Management',
                        majors: ['Financial Management'],
                    },
                ],
            },
            {
                value: 'CCS',
                name: 'College of Computer Studies',
                programs: [
                    {
                        name: 'Bachelor of Science in Information Technology',
                        majors: [],
                    },
                ],
            },
            {
                value: 'CCJ',
                name: 'College of Criminal Justice',
                programs: [
                    {
                        name: 'Bachelor of Science in Criminology',
                        majors: [],
                    },
                ],
            },
            {
                value: 'COED',
                name: 'College of Education',
                programs: [
                    {
                        name: 'Bachelor of Elementary Education',
                        majors: ['General Education'],
                    },
                    {
                        name: 'Bachelor of Secondary Education',
                        majors: ['Science'],
                    },
                    {
                        name: 'Bachelor of Technology and Livelihood Education',
                        majors: ['Home Economics'],
                    },
                ],
            },
            {
                value: 'COF',
                name: 'College of Fisheries',
                programs: [
                    {
                        name: 'Bachelor of Science in Fisheries',
                        majors: [],
                    },
                ],
            },
        ],
    },

    {
        campus: 'Fortune Towne',
        colleges: [
            {
                value: 'CBMA',
                name: 'College of Business Management & Accountancy',
                programs: [
                    {
                        name: 'Bachelor of Science in Accountancy',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Business Administration',
                        majors: ['Financial Management'],
                    },
                    {
                        name: 'Bachelor of Science in Entrepreneurship',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Management Accounting',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Office Administration',
                        majors: [],
                    },
                    {
                        name: 'Master of Business Administration',
                        majors: [],
                    },
                    { name: 'Master of Public Administration', majors: [] },
                ],
            },
            {
                value: 'CCS',
                name: 'College of Computer Studies',
                programs: [
                    {
                        name: 'Bachelor of Science in Information Systems',
                        majors: [],
                    },
                ],
            },
        ],
    },

    {
        campus: 'Alijis',
        colleges: [
            {
                value: 'CCS',
                name: 'College of Computer Studies',
                programs: [
                    {
                        name: 'Bachelor of Science in Information Systems',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Information Technology',
                        majors: [],
                    },
                ],
            },
            {
                value: 'COE',
                name: 'College of Engineering',
                programs: [
                    {
                        name: 'Bachelor of Science in Computer Engineering',
                        majors: [],
                    },
                    {
                        name: 'Bachelor of Science in Electronics Engineering',
                        majors: [],
                    },
                ],
            },
            {
                value: 'CIT',
                name: 'College of Industrial Technology',
                programs: [
                    {
                        name: 'Bachelor of Industrial Technology',
                        majors: [
                            'Architectural Drafting Technology',
                            'Automotive Technology',
                            'Computer Technology',
                            'Culinary Technology',
                            'Electrical Technology',
                            'Electronics Technology',
                            'Mechanical Technology',
                        ],
                    },
                    {
                        name: 'Bachelor of Science in Industrial Technology',
                        majors: [
                            'Architectural Drafting Technology',
                            'Automotive Technology',
                            'Computer Technology',
                            'Culinary Technology',
                            'Electrical Technology',
                            'Electronics Technology',
                            'Mechanical Technology',
                        ],
                    },
                ],
            },
            {
                value: 'COED',
                name: 'College of Education',
                programs: [
                    {
                        name: 'Bachelor of Technical Vocational Teacher Education',
                        majors: [
                            'Electrical Technology',
                            'Electronics Technology',
                        ],
                    },
                ],
            },
        ],
    },
];
