// Keep the Angular/JSDOM suite runnable on developer machines with limited memory.
export default { test: { maxWorkers: 2, fileParallelism: false } };
