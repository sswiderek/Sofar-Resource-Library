// This is a temporary file to help update the code
// Here's the code to add immediately after the excludedResources check
// in both MemStorage and DatabaseStorage getFilteredResources methods:

      // Filter out resources marked as "Partners Only"
      if (resource.partnersOnly === true) {
        console.log(`Filtering out partners-only resource: ${resource.name}`);
        return false;
      }