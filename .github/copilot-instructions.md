# Copilot Instructions

This is a threat-blocking Safari extension project focused on security and responsible disclosure.

## Project Overview

The Threat Blocker Safari Extension is a defensive security tool that:
- Integrates with public threat intelligence feeds (URLhaus, PhishTank)
- Blocks malicious domains and phishing URLs in real-time
- Maintains activity logs for security awareness
- Follows ethical security research principles

## Key Files

- `src/threatFeed.ts` - Threat intelligence feed manager and indicator checking
- `src/background.ts` - Safari extension background script for blocking logic
- `src/popup.ts` - User interface for displaying blocked threats
- `package.json` - Project dependencies and build scripts

## Development Workflow

1. **Development**: `npm run dev` - Build with source maps
2. **Production**: `npm run build` - Optimized build
3. **Testing**: `npm test` - Run unit tests
4. **Linting**: `npm run lint` - Code quality checks

## Important Guidelines

- **Ethical Use Only**: This extension is for defensive security and threat protection
- **Local Processing**: All threat checking happens locally, no data exfiltration
- **Responsible Disclosure**: Follow ethical hacking principles and legal guidelines
- **Public Feeds Only**: Uses only publicly available threat intelligence sources
- **User Consent**: Users must opt-in to using this security tool

## Architecture

- TypeScript for type safety
- Safari Web Extension APIs for browser integration
- Jest for unit testing
- ESLint for code quality

## Adding New Threat Feeds

To add new threat intelligence sources:

1. Create a new parser method in `ThreatIntelligenceFeed` class
2. Add source configuration to the `sources` array
3. Implement the parser to return `ThreatIndicator[]`
4. Add tests for the new feed

## Testing

- Unit tests for threat feed operations
- Mock API responses for external feeds
- Test coverage for blocking logic

## Deployment

1. Build the project: `npm run build`
2. Output is in `dist/` directory
3. Load in Safari following WebExtension guidelines
4. Enable developer extensions for testing
