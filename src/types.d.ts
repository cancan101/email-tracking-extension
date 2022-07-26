import 'gmail-js';

type GeoData = {
  city: string;
  region: string;
};

type ClientIpGeo = {
  source: string;
  data?: GeoData;
  rule?: string;
  emailProvider?: string;
};

type Tracker = { threadId: string; emailSubject: string };

export type View = {
  id: string;
  createdAt: string;
  clientIpGeo?: ClientIpGeo;
  tracker: Tracker;
};
