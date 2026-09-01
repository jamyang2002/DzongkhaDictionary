use std::time::{Duration, Instant};
use unicode_normalization::UnicodeNormalization;

pub const DOUBLE_COPY_WINDOW: Duration = Duration::from_millis(950);
pub const MAX_QUERY_CHARACTERS: usize = 160;

#[derive(Default)]
pub struct DoubleCopyDetector {
    last_copy: Option<(String, Instant)>,
}

impl DoubleCopyDetector {
    pub fn observe(&mut self, raw_text: &str, now: Instant) -> Option<String> {
        let Some(query) = normalize_query(raw_text) else {
            self.reset();
            return None;
        };

        let is_double_copy = self
            .last_copy
            .as_ref()
            .is_some_and(|(previous, timestamp)| {
                previous == &query && now.duration_since(*timestamp) <= DOUBLE_COPY_WINDOW
            });

        if is_double_copy {
            self.reset();
            Some(query)
        } else {
            self.last_copy = Some((query, now));
            None
        }
    }

    pub fn reset(&mut self) {
        self.last_copy = None;
    }
}

pub fn normalize_query(raw_text: &str) -> Option<String> {
    let normalized = raw_text.nfc().collect::<String>();
    let query = normalized.split_whitespace().collect::<Vec<_>>().join(" ");
    let length = query.chars().count();

    (length > 0 && length <= MAX_QUERY_CHARACTERS).then_some(query)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_the_same_word_copied_twice() {
        let start = Instant::now();
        let mut detector = DoubleCopyDetector::default();

        assert_eq!(detector.observe("mother", start), None);
        assert_eq!(
            detector.observe("mother", start + Duration::from_millis(500)),
            Some("mother".to_string())
        );
    }

    #[test]
    fn supports_dzongkha_unicode_and_normalizes_whitespace() {
        let start = Instant::now();
        let mut detector = DoubleCopyDetector::default();

        assert_eq!(detector.observe("  རྫོང་\nཁ་  ", start), None);
        assert_eq!(
            detector.observe("རྫོང་ ཁ་", start + Duration::from_millis(300)),
            Some("རྫོང་ ཁ་".to_string())
        );
    }

    #[test]
    fn rejects_late_or_overlong_copies() {
        let start = Instant::now();
        let mut detector = DoubleCopyDetector::default();

        assert_eq!(detector.observe("peace", start), None);
        assert_eq!(
            detector.observe(
                "peace",
                start + DOUBLE_COPY_WINDOW + Duration::from_millis(1)
            ),
            None
        );
        assert_eq!(
            detector.observe(&"x".repeat(MAX_QUERY_CHARACTERS + 1), start),
            None
        );
    }
}
