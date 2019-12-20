/* @flow */

import React from 'react'
import Document, { Html, Head, Main, NextScript } from 'next/document';

// ! _document is only rendered on the server side and not on the client side.
// ! Hence: event handlers like onClick can't be added to this file

// ?? Resolution order
// ?
// ?? On the server:
// ? 1. app.getInitialProps
// ? 2. page.getInitialProps
// ? 3. document.getInitialProps
// ? 4. app.render
// ? 5. page.render
// ? 6. document.render
// ?
// ?? On the server with error (https://tinyurl.com/y6peoe42):
// ? 1. document.getInitialProps
// ? 2. app.render
// ? 3. page.render
// ? 4. document.render
// ?
// ?? On the client:
// ? 1. app.getInitialProps
// ? 2. page.getInitialProps
// ? 3. app.render
// ? 4. page.render

export default class extends Document {
    render() {
        return (
            <Html>
                <Head>
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
