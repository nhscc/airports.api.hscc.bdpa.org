/// <reference types="react" />
declare type Props = {
    previouslyHydratedDb: boolean;
    shouldHydrateDb: boolean;
    isInProduction: boolean;
    nodeEnv: string;
};
export declare function getServerSideProps(): Promise<{
    props: {
        isInProduction: boolean;
        shouldHydrateDb: boolean;
        previouslyHydratedDb: boolean;
        nodeEnv: "development" | "production" | "test";
    };
}>;
export default function Index({ previouslyHydratedDb, shouldHydrateDb, isInProduction, nodeEnv }: Props): JSX.Element;
export {};
