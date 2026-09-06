// Run after bun run build to verify production asset caching and browser flows.
import config from './playwright.config'
const productionConfig = {
    ...config,
    use: { ...config.use, baseURL: 'http://localhost:3016' },
    webServer: {
        command: 'bun --bun next start --port 3016',
        url: 'http://localhost:3016',
        reuseExistingServer: false,
        timeout: 120000,
    },
}

export default productionConfig
