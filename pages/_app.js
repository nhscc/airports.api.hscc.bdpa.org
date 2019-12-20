/* @flow */

import React from 'react'
import App from 'next/app'
import Head from 'next/head'

// ? This is the file where you should store app-wide data and make app-wide
// ? changes, like a shared layout. More details here:
// ? https://nextjs.org/docs/#custom-app

// ? The difference between _app and _document: _app is used to initialize pages
// ? (and runs on both client and server) while _document just represents the
// ? surrounding markup (i.e. html, head, body) and is only run on the server
// ? where it's necessary to generate markup.

export default class extends App {
    // * Custom site-wide getInitialProps (run before everything)
    // ! Note: Adding a custom getInitialProps here will negatively affect
    // ! performance! See:
    // ! https://github.com/zeit/next.js#automatic-static-optimization
    // static async getInitialProps({ Component, ctx }) {
    //     let pageProps = {};

    //     if(Component.getInitialProps) {
    //         pageProps = await Component.getInitialProps(ctx);
    //     }

    //     return { pageProps };
    // }

    // * Custom error handling (if you want)
    // * Also check out _error.js for custom error pages:
    // * https://tinyurl.com/y6peoe42
    // componentDidCatch(error, errorInfo) {
    //     console.log('CUSTOM ERROR HANDLING', error)
    //     // ? This is needed to render errors correctly in development / production
    //     super.componentDidCatch(error, errorInfo)
    // }

    render() {
        const { Component, pageProps } = this.props;

        return (// * ContextProvider(s) for passing down state could go here
            <React.Fragment>
                <Head>
                    <title>No Browser Access!</title>
                </Head>
                <React.StrictMode>
                    <Component { ...pageProps } />
                </React.StrictMode>
            </React.Fragment>
        );
    }
}
