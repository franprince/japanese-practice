import { BasePage } from './base.page'

export class KanjiPage extends BasePage {
    override async goto() {
        await super.goto('/kanji')
        await this.waitForPageLoad()
    }
}
