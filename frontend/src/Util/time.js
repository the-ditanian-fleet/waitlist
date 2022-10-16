export function formatDuration(durationSeconds) {
  var groups = [];

  var hours = Math.floor(durationSeconds / 3600);
  if (hours > 0) groups.push(`${hours}h`);

  var minutes = Math.floor((durationSeconds % 3600) / 60);
  if (minutes > 0) groups.push(`${minutes}min`);

  var seconds = durationSeconds % 60;
  if (seconds > 0) groups.push(`${seconds}s`);

  if (!groups) {
    return "-";
  }
  if (groups.length > 1) {
    return `${groups[0]} ${groups[1]}`;
  }
  return groups[0];
}

export function formatDatetime(dateObj) {
  return dateObj.toLocaleString("en-GB", { timeZone: "UTC" });
}

export function timeTillNow(dateTime) {
  // Build an output string with the appropriate prefix & suffix
  const BuildOutputStr = (number, unit, past = false) => {
    // Truncate decimals
    number = Math.trunc(number);

    if (number > 1) {
      unit += "s";
    }

    let str = "";
    if (!past) {
      str += "in ";
    }

    str += `${number.toLocaleString()} ${unit}`;
    if (past) {
      str += " ago";
    }

    return str;
  };

  // Validate the functions input parameter typeof
  if (!(dateTime instanceof Date)) {
    let err = `expected date saw ${typeof dateTime}`;
    return err;
  }

  const now = new Date();
  const isPast = dateTime < now;

  // Get the number of seconds between then and now
  var diff = Math.abs(now - dateTime) / 1000;

  if (diff < 60) {
    return isPast ? "just now" : "less than one minute";
  }

  // Calculate the minutes
  diff = diff / 60;
  if (diff < 60) {
    return BuildOutputStr(diff, "minute", isPast);
  }

  // Calculate the hours
  diff = diff / 60;
  if (diff < 24) {
    return BuildOutputStr(diff, "hour", isPast);
  }

  // Calculate the days
  diff = diff / 24;
  if (diff < 365) {
    return BuildOutputStr(diff, "day", isPast);
  }

  return dateTime.toLocaleDateString("en-GB", { timeZone: "UTC" });
}
