import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs', async () => {
  return {
    default: {
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn()
    },
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn()
  };
});

// Mock path module
vi.mock('path', async () => {
  return {
    default: {
      resolve: vi.fn(path => path),
      dirname: vi.fn(path => path.substring(0, path.lastIndexOf('/')))
    },
    resolve: vi.fn(path => path),
    dirname: vi.fn(path => path.substring(0, path.lastIndexOf('/')))
  };
});

// Mock console and process.exit
beforeEach(() => {
  console.log = vi.fn();
  console.error = vi.fn();
  vi.spyOn(process, 'exit').mockImplementation(() => {});
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('copy-data script', () => {
  it('should copy the file from source to destination', async () => {
    // Setup mocks
    const mockFileContent = JSON.stringify({ test: 'data' });
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(mockFileContent);
    path.resolve.mockImplementation(p => p);
    
    // Create a fresh module system for each test
    vi.resetModules();
    
    // Run the script (we use dynamic import to execute it as a module)
    await import('../copy-data.js');
    
    // Verify the file was copied correctly
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Successfully copied'));
  });
  
  it('should create the destination directory if it does not exist', async () => {
    // Setup mocks
    const mockFileContent = JSON.stringify({ test: 'data' });
    fs.existsSync.mockReturnValue(false); // Directory doesn't exist
    fs.readFileSync.mockReturnValue(mockFileContent);
    
    // Create a fresh module system for this test
    vi.resetModules();
    
    // Run the script
    await import('../copy-data.js');
    
    // Verify directory was created and file was copied
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
  
  it('should handle errors properly', async () => {
    // Setup mocks to throw an error
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File read error');
    });
    
    // Create a fresh module system for this test
    vi.resetModules();
    
    // Run the script
    await import('../copy-data.js');
    
    // Verify error was logged and process.exit was called
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error copying canonical data file:'),
      expect.any(Error)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
}); 