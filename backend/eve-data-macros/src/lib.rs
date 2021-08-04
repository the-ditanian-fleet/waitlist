extern crate proc_macro;

use eve_data_core::{TypeDB, TypeError};
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Error, LitStr};

#[proc_macro]
pub fn type_id(input: TokenStream) -> TokenStream {
    let type_name = parse_macro_input!(input as LitStr);
    match TypeDB::id_of_fuzzy(&type_name.value()) {
        Ok(the_type) => quote! {
            #the_type
        },
        Err(TypeError::NothingMatched) => {
            Error::new(type_name.span(), "Could not find type in SDE").to_compile_error()
        }
        e => {
            e.unwrap();
            panic!()
        }
    }
    .into()
}
