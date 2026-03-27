//! 挂载根目录内的文件操作；`canonicalize` + 前缀校验防御 path traversal。

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

pub const MAX_READ_BYTES: u64 = 10 * 1024 * 1024;

#[derive(Debug, Error)]
pub enum FsError {
    #[error("no mounted workspace roots")]
    NoMounts,
    #[error("path outside mounted roots")]
    OutsideMounts,
    #[error("invalid or inaccessible path")]
    InvalidPath,
    #[error("path is not a directory")]
    NotDirectory,
    #[error("path is not a file")]
    NotFile,
    #[error("file too large to read (max {MAX_READ_BYTES} bytes)")]
    TooLarge,
    #[error("write not confirmed")]
    WriteNotConfirmed,
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Serialize)]
pub struct DirEntryJson {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
}

/// 将用户传入的 `path` 解析到某一挂载根之下（`canonicalize` 后必须仍为根前缀）。
pub fn resolve_within_roots(roots: &[PathBuf], user_path: &str) -> Result<PathBuf, FsError> {
    if roots.is_empty() {
        return Err(FsError::NoMounts);
    }
    let trimmed = user_path.trim();
    for root in roots {
        let root_canon = root.canonicalize().map_err(|_| FsError::InvalidPath)?;
        let candidate = if trimmed.is_empty() {
            root_canon.clone()
        } else if Path::new(trimmed).is_absolute() {
            PathBuf::from(trimmed)
        } else {
            root_canon.join(trimmed.trim_start_matches(|c: char| c == '/' || c == '\\'))
        };
        let canon = candidate.canonicalize().map_err(|_| FsError::InvalidPath)?;
        if is_same_or_child(&root_canon, &canon) {
            return Ok(canon);
        }
    }
    Err(FsError::OutsideMounts)
}

fn is_same_or_child(root: &Path, child: &Path) -> bool {
    child.starts_with(root)
}

pub fn list_dir(path: &Path) -> Result<Vec<DirEntryJson>, FsError> {
    if !path.is_dir() {
        return Err(FsError::NotDirectory);
    }
    let mut out = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let meta = entry.metadata()?;
        let name = entry.file_name().to_string_lossy().into_owned();
        out.push(DirEntryJson {
            name,
            is_dir: meta.is_dir(),
            size: meta.len(),
        });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}

pub fn read_file_bounded(path: &Path) -> Result<Vec<u8>, FsError> {
    if !path.is_file() {
        return Err(FsError::NotFile);
    }
    let len = path.metadata()?.len();
    if len > MAX_READ_BYTES {
        return Err(FsError::TooLarge);
    }
    Ok(fs::read(path)?)
}

pub fn write_file(path: &Path, bytes: &[u8], write_confirmed: bool) -> Result<(), FsError> {
    if !write_confirmed {
        return Err(FsError::WriteNotConfirmed);
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, bytes)?;
    Ok(())
}

pub fn path_hash(path: &Path) -> String {
    use sha2::{Digest, Sha256};
    let s = path.to_string_lossy();
    let mut h = Sha256::new();
    h.update(s.as_bytes());
    hex::encode(h.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;

    #[test]
    fn rejects_traversal_outside_root() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(&safe).unwrap();
        let roots = vec![safe.clone()];
        let evil = resolve_within_roots(&roots, "../");
        assert!(matches!(evil, Err(FsError::OutsideMounts)));
    }

    #[test]
    fn allows_file_under_root() {
        let tmp = tempfile::tempdir().unwrap();
        let safe = tmp.path().join("workspace");
        fs::create_dir_all(&safe).unwrap();
        let f = safe.join("a.txt");
        File::create(&f).unwrap().write_all(b"x").unwrap();
        let roots = vec![safe.clone()];
        let p = resolve_within_roots(&roots, "a.txt").unwrap();
        assert_eq!(p, f.canonicalize().unwrap());
    }
}
