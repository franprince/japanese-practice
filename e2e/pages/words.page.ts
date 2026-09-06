import { BasePage } from './base.page'

export class WordsPage extends BasePage {
    override async goto() {
        await super.goto('/words')
        await this.waitForPageLoad()
    }
}
