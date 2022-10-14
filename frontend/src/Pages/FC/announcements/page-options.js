/**
 * The objects below contain the page-filter options for the announcment system.
 *
 * "Name" is displayed to the FC in the various admin panels. "Value" is the URL filter.
 *  Example: "Guides" has the pathname rule "/guide", that means this filter will work on
 *           the page `/guide` and on any sub routes - e.g., `/guide/become-an-fc`
 */
export const options = [
  { name: "Fits", value: "/fits" },
  { name: "Guides", value: "/guide" },
  { name: "Skills", value: "/skills" },
  { name: "Profile", value: "/pilot" },
  { name: "Waitlist", value: "/waitlist" },
];
