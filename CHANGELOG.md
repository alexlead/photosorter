# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-03-29

### Updated
- **File Utilities**: Changed the way files are processed to use the file processor instead of the file utility.
- **File Processor**: Added support for processing files when the application is run in development mode (npm run dev).

### Fixed
- **Log Viewer**: Fixed an issue where the log viewer would not display logs when the application was run in development mode (npm run dev).
- **File Processing**: Fixed an issue where the file processor would not process files when the application was run in development mode.

## [1.0.0] - 2026-03-22

The initial release of PhotoSorter, a powerful desktop application designed to organize messy photo and video archives into a clean, chronological folder structure.

### Added
- **Core Organization Logic**: 
    - Automated sorting of photos and videos by capture date.
    - Multiple grouping modes: Years, Quarters, and Months.
    - Customizable folder masks.
- **Advanced Filtering**:
    - Filter by file type (Photos, Videos, or Specific Extensions).
    - Filter by date range and file size.
    - Subfolder support for recursive processing.
- **Conflict Management**:
    - Strategies for resolving file name collisions: Skip, Replace, and Compare & Delete (duplicate detection).
- **User Interface**:
    - Modern, responsive UI with Dark Mode support.
    - Interactive log viewer to track processing progress in real-time.
    - Simplified "About" window with program information and links.
- **Technology Stack**: 
    - Built with Electron 30, React 18, Vite 5, TypeScript 5, and Tailwind CSS.
    - Multi-language support (i18next).
