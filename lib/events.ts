import { env } from "@/lib/env";
import { writeFile } from "fs/promises";
import type { Event } from "@/types/event";

//const jsonFilePath = "./public/concerts.json";
//&lat=${env("LATITUDE_EU")}&long=${env("LONGITUDE_EU")}&radius=${env("RADIUS_EU")}
const urlEU = `${env(
  "URL_TICKETMASTER"
)}events.json?classificationName=music&countryCode=${env(
  "EUROPE_COUNTRIES"
)}&apikey=${env("APIKEY_TICKETMASTER")}`;

const checkResponse = async (response: Response) => {
  const json = await response.json();
  if (!response.ok) {
    const errorDetail = json.errors ? json.errors[0].detail : "Unknown error";
    throw new Error(
      `HTTP error! Status: ${response.status} - Error: ${errorDetail}`
    );
  }
  return json;
};

const processEvents = (events: any) => {
  return events
    .filter((event: any) =>
      event._embedded.venues.some(
        (venue: any) =>
          venue.location &&
          venue.location.latitude &&
          venue.location.longitude &&
          venue.address &&
          venue.address.line1
      )
    )
    .map((res: any) => ({
      ...res,
      venues: res._embedded.venues.map((venue: any) => ({
        ...venue,
        city: venue.city.name,
        country: venue.country.name,
        state: venue.state ? venue.state.name : null,
        address: venue.address.line1,
      })),
    })) as Event[];
};

export const getAllEvents = async () => {
  const allEvents: Event[] = [];
  const totalPages = 12;

  for (let page = 1; page <= totalPages; page++) {
    const events = await getEventsByPage(page);
    allEvents.push(...events);
  }

  return allEvents;
};

export const getEventById = async (id: string) => {
  const response = await fetch(
    `${env("URL_TICKETMASTER")}events.json?id=${id}&apikey=${env(
      "APIKEY_TICKETMASTER"
    )}`
  );

  const jsonConcerts = await checkResponse(response);

  try {
    return processEvents(jsonConcerts._embedded.events) as Event[];
  } catch (error) {
    console.error(`Error fetching event by id (${id}):`, error);
    return [];
  }
};

export const getEventsByDates = async (start: string, end: string) => {
  const response = await fetch(
    `${urlEU}&startDateTime=${start}&endDateTime=${end}`
  );

  const jsonConcerts = await checkResponse(response);

  try {
    return processEvents(jsonConcerts._embedded.events) as Event[];
  } catch (error) {
    console.error(`Error fetching events by dates (${start} - ${end}):`, error);
    return [];
  }
};

const getEventsByPage = async (page: number) => {
  const response = await fetch(`${urlEU}&size=80&page=${page}`);
  const jsonConcerts = await checkResponse(response);

  try {
    return processEvents(jsonConcerts._embedded.events) as Event[];
  } catch (error) {
    console.error(`Error fetching events for page ${page}:`, error);
    return [];
  }
};

export const getEventByIdEdu = async (id: string) => {
  const response = await fetch(
    `${env(
      "URL_TICKETMASTER"
    )}events/${id}.json?apikey=${env(
      "APIKEY_TICKETMASTER"
    )}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  try {
    const jsonEvent = await response.json();

    const event: Event = {
      id: jsonEvent.id,
      name: jsonEvent.name,
      type: jsonEvent.type,
      url: jsonEvent.url,
      pleaseNote: jsonEvent.pleaseNote,
      images: jsonEvent.images,
      dates: {
        start: {
          localDate: new Date(jsonEvent.dates.start.localDate),
          localTime: new Date(jsonEvent.dates.start.localTime),
        },
        end: jsonEvent.dates.end ? {
          localDate: new Date(jsonEvent.dates.end.localDate),
          localTime: new Date(jsonEvent.dates.end.localTime),
        } : undefined,
      },
      _links: {
        self: { href: jsonEvent._links.self.href },
        attractions: jsonEvent._links.attractions.map((attraction: any) => ({ href: attraction.href })),
        venues: jsonEvent._links.venues.map((venue: any) => ({ href: venue.href })),
      },
      _embedded: {
        attractions: jsonEvent._embedded.attractions.map((attraction: any) => ({
          name: attraction.name,
          images: attraction.images,
        })),
      },
      venues: jsonEvent._embedded.venues.map((venue: any) => ({
        id: venue.id,
        name: venue.name,
        city: venue.city.name,
        country: venue.country.name,
        state: venue.state ? venue.state.name : null,
        address: venue.address.line1,
        location: {
          longitude: venue.location.longitude,
          latitude: venue.location.latitude,
        },
      })),
      priceRanges: jsonEvent.priceRanges
    };

    return event;
  } catch (error) {
    console.error(`Error fetching event with id ${id}:`, error);
    return null;
  }
};