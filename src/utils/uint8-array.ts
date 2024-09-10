export function combineUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  // Calculate total length
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);

  // Create a new Uint8Array with the total length
  const combinedArray = new Uint8Array(totalLength);

  // Copy each array into the combined array
  let offset = 0;
  arrays.forEach(arr => {
      combinedArray.set(arr, offset);
      offset += arr.length;
  });

  return combinedArray;
}