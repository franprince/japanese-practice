import { BasePage } from './base.page'

export class DatesPage extends BasePage {
    override async goto() {
        await super.goto('/dates')
        await this.waitForPageLoad()
    }
}
