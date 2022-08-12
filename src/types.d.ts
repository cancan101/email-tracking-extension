import 'gmail-js';

type GeoData = {
  city: string;
  region?: string;
  regionCode: string;
  country?: string;
  countryCode: string;
  isMobile?: boolean;
};

type ClientIpGeo = {
  source: string;
  data?: GeoData;
  rule?: string;
  emailProvider?: string;
};

type Tracker = {
  threadId: string;
  emailSubject: string;
  createdAt: string;
  scheduledSendAt?: string;
};

export type View = {
  id: string;
  createdAt: string;
  clientIpGeo?: ClientIpGeo;
  tracker: Tracker;
};
