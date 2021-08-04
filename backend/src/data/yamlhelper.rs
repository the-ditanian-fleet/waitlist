use serde::de::DeserializeOwned;

// The yaml file uses "<<" (merge keys) to optimize readability and we need to deal with the processing step for that ourselves.
pub fn from_file<T>(filename: &str) -> T
where
    T: DeserializeOwned,
{
    let data_str = std::fs::read_to_string(filename).expect("Failed to load data file");
    let file_data: serde_yaml::Value =
        serde_yaml::from_str(&data_str).expect("Failed to load data yaml");
    let merged = yaml_merge_keys::merge_keys_serde(file_data).unwrap();
    let back_to_str = serde_yaml::to_string(&merged).unwrap();
    serde_yaml::from_str(&back_to_str).unwrap()
}
