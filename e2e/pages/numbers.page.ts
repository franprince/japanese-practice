import { BasePage } from './base.page'

export class NumbersPage extends BasePage {
    override async goto() {
        await super.goto('/numbers')
        await this.waitForPageLoad()
    }
}
