#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Attribute {
    MetaLevel,
    TrainingTimeMultiplier,

    EmResist,
    ExplosiveResist,
    KineticResist,
    ThermalResist,

    PrimarySkill,
    PrimarySkillLevel,
    SecondarySkill,
    SecondarySkillLevel,
    TertiarySkill,
    TertiarySkillLevel,
    QuaternarySkill,
    QuaternarySkillLevel,
    QuinarySkill,
    QuinarySkillLevel,
    SenarySkill,
    SenarySkillLevel,

    Other(i32),
}

impl Attribute {
    pub fn from_id(id: i32) -> Self {
        match id {
            633 => Self::MetaLevel,
            275 => Self::TrainingTimeMultiplier,

            984 => Self::EmResist,
            985 => Self::ExplosiveResist,
            986 => Self::KineticResist,
            987 => Self::ThermalResist,

            182 => Self::PrimarySkill,
            277 => Self::PrimarySkillLevel,
            183 => Self::SecondarySkill,
            278 => Self::SecondarySkillLevel,
            184 => Self::TertiarySkill,
            279 => Self::TertiarySkillLevel,
            1285 => Self::QuaternarySkill,
            1286 => Self::QuaternarySkillLevel,
            1289 => Self::QuinarySkill,
            1287 => Self::QuinarySkillLevel,
            1290 => Self::SenarySkill,
            1288 => Self::SenarySkillLevel,

            i => Self::Other(i),
        }
    }
}
