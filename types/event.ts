type EventDateTime = {
  localDate: Date;
  localTime: Date;
};

type Location = {
  longitude: string;
  latitude: string;
};

type Image = {
  ratio: string;
  url: string;
  width: number;
  height: number;
};

type Venue = {
  id: number;
  name: string;
  city: string;
  country: string;
  state?: string;
  address: string;
  location: Location;
};

type Link = {
  href: string;
};

type Links = {
  self: Link;
  attractions: Link[];
  venues: Link[];
};

type Attraction = {
  name: string;
  images: Image[];
};

export type Event = {
  id: number;
  name: string;
  type: string;
  url: string;
  pleaseNote: string;
  images: Image[];
  dates: {
    start: EventDateTime;
    end?: EventDateTime;
  };
  _links: Links;
  _embedded: {
    attractions: Attraction[];
  };
  venues: Venue[];
};

