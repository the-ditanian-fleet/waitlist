use eve_data_core::TypeID;

fn detect_base_set(implants: &[TypeID]) -> Option<&'static str> {
    let set_implants = [
        (
            "AMULET1-10",
            [
                type_id!("High-grade Amulet Alpha"),
                type_id!("High-grade Amulet Beta"),
                type_id!("High-grade Amulet Delta"),
                type_id!("High-grade Amulet Epsilon"),
                type_id!("High-grade Amulet Gamma"),
                type_id!("High-grade Amulet Omega"),
            ],
        ),
        (
            "HYBRID1-10",
            [
                type_id!("High-grade Amulet Alpha"),
                type_id!("High-grade Amulet Beta"),
                type_id!("High-grade Amulet Delta"),
                type_id!("High-grade Amulet Epsilon"),
                type_id!("High-grade Amulet Gamma"),
                type_id!("% WS-618"),
            ],
        ),
        (
            "WARPSPEED1-10",
            [
                type_id!("High-grade Ascendancy Alpha"),
                type_id!("High-grade Ascendancy Beta"),
                type_id!("High-grade Ascendancy Delta"),
                type_id!("High-grade Ascendancy Epsilon"),
                type_id!("High-grade Ascendancy Gamma"),
                type_id!("High-grade Ascendancy Omega"),
            ],
        ),
        (
            "SAVIOR1-10",
            [
                type_id!("High-grade Savior Alpha"),
                type_id!("High-grade Savior Beta"),
                type_id!("High-grade Savior Delta"),
                type_id!("High-grade Savior Epsilon"),
                type_id!("High-grade Savior Gamma"),
                type_id!("High-grade Savior Omega"),
            ],
        ),
        (
            "WARPSPEED1-10",
            [
                type_id!("High-grade Ascendancy Alpha"),
                type_id!("High-grade Ascendancy Beta"),
                type_id!("High-grade Ascendancy Delta"),
                type_id!("High-grade Ascendancy Epsilon"),
                type_id!("High-grade Ascendancy Gamma"),
                type_id!("% WS-618"),
            ],
        ),
    ];

    for (setname, ids) in set_implants {
        let is_match = ids.iter().all(|f| implants.contains(f));
        if is_match {
            return Some(setname);
        }
    }

    None
}

fn detect_slot7(hull: TypeID, implants: &[TypeID]) -> Option<()> {
    if implants.contains(&type_id!("Ogdin's Eye Coordination Enhancer"))
        || implants.contains(&type_id!("% MR-706"))
        || (hull == type_id!("Nestor") && implants.contains(&type_id!("% RA-706")))
    {
        Some(())
    } else {
        None
    }
}

fn detect_slot8(hull: TypeID, implants: &[TypeID]) -> Option<()> {
    if implants.contains(&type_id!("% EM-806"))
        || (hull == type_id!("Vindicator") && implants.contains(&type_id!("% MR-807")))
    {
        Some(())
    } else {
        None
    }
}

#[allow(clippy::if_same_then_else)]
fn detect_slot9(hull: TypeID, implants: &[TypeID]) -> Option<()> {
    if hull == type_id!("Nestor") || hull == type_id!("Oneiros") || hull == type_id!("Guardian") {
        // No useful implants.
        Some(())
    } else if implants.contains(&type_id!("% RF-906"))
        || implants.contains(&type_id!("% SS-906"))
        || implants.contains(&type_id!("Pashan's Turret Customization Mindlink"))
    {
        Some(())
    } else {
        None
    }
}

pub fn detect_slot10(hull: TypeID, implants: &[TypeID]) -> Option<()> {
    if hull == type_id!("Nightmare") || hull == type_id!("Paladin") {
        if implants.contains(&type_id!("Pashan's Turret Handling Mindlink"))
            || implants.contains(&type_id!("% LE-1006"))
        {
            Some(())
        } else {
            None
        }
    } else if hull == type_id!("Vindicator") || hull == type_id!("Kronos") {
        if implants.contains(&type_id!("% LH-1006")) {
            Some(())
        } else {
            None
        }
    // disabled, logi's don't need slot 10 for an implant tag
    }
    /*else if hull == type_id!("Nestor")
        || hull == type_id!("Oneiros")
        || hull == type_id!("Guardian")
    {
        if implants.contains(&type_id!("% HG-1006")) || implants.contains(&type_id!("% HG-1008")) {
            Some(())
        } else {
            None
        }
    } */
    else {
        // What ship is that?! Probably doesn't need slot 10?
        Some(())
    }
}

pub fn detect_set(hull: TypeID, implants: &[TypeID]) -> Option<&'static str> {
    let base_set = detect_base_set(implants)?;
    detect_slot7(hull, implants)?;
    detect_slot8(hull, implants)?;
    detect_slot9(hull, implants)?;
    Some(base_set)
}
