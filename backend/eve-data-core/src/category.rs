#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Category {
    Ship,
    Module,
    Charge,
    Drone,
    Implant,
    Other(i32),
}

impl Category {
    pub fn category_name(&self) -> &'static str {
        match self {
            Self::Ship => "ship",
            Self::Module => "module",
            Self::Charge => "charge",
            Self::Drone => "drone",
            Self::Implant => "implant",
            Self::Other(_) => "_other",
        }
    }
    pub fn from_id(id: i32) -> Self {
        match id {
            6 => Self::Ship,
            7 => Self::Module,
            8 => Self::Charge,
            18 => Self::Drone,
            20 => Self::Implant,
            i => Self::Other(i),
        }
    }
}
