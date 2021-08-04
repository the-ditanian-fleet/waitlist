use std::collections::HashSet;

use serde::Deserialize;

use crate::data::yamlhelper;

lazy_static::lazy_static! {
    static ref PUBLIC_TAGS: HashSet<String> = build_public_tags();
}

#[derive(Debug, Deserialize)]
struct TagFile {
    public_tags: Vec<String>,
}

fn build_public_tags() -> HashSet<String> {
    let data: TagFile = yamlhelper::from_file("./data/tags.yaml");
    data.public_tags.into_iter().collect()
}

pub fn public_tags() -> &'static HashSet<String> {
    &PUBLIC_TAGS
}
