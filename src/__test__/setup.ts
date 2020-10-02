/* eslint-disable no-var */
import { populateEnv } from 'universe/dev-utils'
import 'expect-puppeteer'
import 'jest-extended'

import type { Page, Browser, BrowserContext as Context } from 'puppeteer';

declare global {
    const page: Page;
    const browser: Browser;
    const context: Context;
}

populateEnv();

// TODO: need to redo test folder setup to make room for integration tests
