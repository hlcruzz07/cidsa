type ProvinceProp = {
    province_id: number;
    province_name: string;
}[];

type CitiesProp = {
    province_id: number;
    municipality_id: number;
    municipality_name: string;
}[];

type BrgysProp = {
    barangay_id: number;
    barangay_name: string;
    municipality_id: number;
}[];

type CitiesApiProp = {
    province_id: number;
    municipality_id: number;
    municipality_name: string;
};

type BrgyApiProp = {
    barangay_id: number;
    barangay_name: string;
    municipality_id: number;
};
