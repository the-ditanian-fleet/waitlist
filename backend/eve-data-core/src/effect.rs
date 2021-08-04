#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Effect(pub i32); // Trying the Effect implementation in a different way to see what works better.
impl Effect {
    pub fn low_power() -> Effect {
        Effect(11)
    }
    pub fn high_power() -> Effect {
        Effect(12)
    }
    pub fn med_power() -> Effect {
        Effect(13)
    }
    pub fn rig_slot() -> Effect {
        Effect(2663)
    }
}
