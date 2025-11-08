const fileNameExtracter = (url) => {
    let parts = url.split("/upload/");
    let publicPart = parts[1]; // "v1762544010/pejh17lalc0qjfhs77bl.jpg"

    // Remove version (starts with "v" + digits)
    let withoutVersion = publicPart.replace(/v\d+\//, "");

    return withoutVersion.split(".")[0];
}
export { fileNameExtracter }