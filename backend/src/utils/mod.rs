use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::result::Result;

/// Generates a random alphanumeric string of length 10.
///
/// # Returns
///
/// A `String` containing the generated random job name.
pub fn generate_random_job_name() -> String {
    let mut rng = thread_rng();
    let job_name: String = (0..10).map(|_| rng.sample(Alphanumeric) as char).collect();
    job_name
}

/// Parses an S3 URI and returns the bucket name and object key.
///
/// # Arguments
///
/// * `uri` - The input S3 URI to be parsed.
///
/// # Returns
///
/// A `Result` containing a tuple of `String` where the first element is the bucket name and the second element is the object key.
///
/// # Errors
///
/// Returns an error if the S3 URI format is invalid.
pub fn parse_s3_uri(uri: &str) -> Result<(String, String), Box<dyn std::error::Error>> {
    let uri = uri
        .trim_start_matches("s3://")
        .trim_start_matches("https://s3.us-east-1.amazonaws.com/");
    let parts: Vec<&str> = uri.splitn(2, '/').collect();

    if parts.len() != 2 {
        return Err("Invalid S3 URI format!".into());
    }

    let bucket = parts[0].to_string();
    let key = parts[1].to_string();

    Ok((bucket, key))
}
