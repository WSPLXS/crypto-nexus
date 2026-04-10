export interface Currency {
  id: string;
  name: string;
  shortName: string;
  price: number;
  incomePerSecond: number;
  icon: string;
  imageUrl: string;
  category: 'main' | 'meme';
}

export interface OwnedCurrency {
  currencyId: string;
  amount: number;
}

export interface UserData {
  id: string;
  nickname: string;
  balance: number;
  isTutorialComplete: boolean;
  ownedCurrencies: OwnedCurrency[];
  selectedCurrency: string;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    effectsEnabled: boolean;
  };
}

export interface CryptoPrice {
  BTC: number;
  ETH: number;
  SOL: number;
}