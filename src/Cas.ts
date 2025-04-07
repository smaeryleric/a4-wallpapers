export interface Cas {
    init(): void;
    showRewarded(immediately?: boolean): Promise<boolean>;
    showInterstitial(immediately?: boolean): Promise<void>;
    isReady(): boolean;
}
