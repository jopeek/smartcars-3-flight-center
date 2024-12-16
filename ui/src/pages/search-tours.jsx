/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useLayoutEffect } from "react";
import { Range, getTrackBackground } from "react-range";
import { Link } from "react-router-dom";
import { request, notify, localApi } from "@tfdidesign/smartcars3-ui-sdk";
import { useEffect, useRef } from "react";
import { GetAircraft } from "../helper.js";
import Autocomplete from "../components/autocomplete";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Flight from "../components/flight";

const baseUrl = "http://localhost:7172/api/com.canadaairvirtual.flight-center/";

const SearchToursContent = (props) => {
  const [tour, setTour] = useState("");
  const [simBriefInstalled, setSimBriefInstalled] = useState(false);
  const [expandedFlight, setExpandedFlight] = useState(-1);
  const [flights, setFlights] = useState([]);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(null);

  useEffect(() => {
    isSimBriefInstalled();
  }, []);

  async function isSimBriefInstalled() {
    try {
      const plugins = await localApi("api/plugins/installed");

      if (!!plugins.find((plugin) => plugin.id === "com.tfdidesign.simbrief")) {
        setSimBriefInstalled(true);
      }
    } catch (error) {
      setSimBriefInstalled(false);
    }
  }

  const getFlights = async () => {
    try {
      let params = {};
      if (tour.length >= 3)
        params.departure = tour.substring(0, Math.min(4, tour.length));

      const response = await request({
        url: `${baseUrl}tours`,
        params: params,
        method: "GET",
      });
      console.log(response);

      if (Array.isArray(response)) {
        setFlights(response);
      } else {
        setFlights([]);
        notify("com.canadaairvirtual.flight-center", null, null, {
          message: "Error parsing flights",
          type: "danger",
        });
      }
    } catch (error) {
      notify("com.canadaairvirtual.flight-center", null, null, {
        message: "Failed to fetch flights",
        type: "danger",
      });
    }
  };

  const updateWidth = () => {
    if (!widthRef.current) return;
    setWidth(widthRef.current.offsetWidth);
  };

  const onWindowResize = () => {
    setHeight("tblBody");
    updateWidth();
  };

  useEffect(() => {
    getFlights();
  }, []);

  useLayoutEffect(() => {
    setHeight("tblBody");
    updateWidth();
  }, []);

  useEffect(() => {
    window.addEventListener("resize", onWindowResize);
    onWindowResize();

    return (_) => {
      window.removeEventListener("resize", onWindowResize);
    };
  });

  const setHeight = (elID) => {
    const el = document.getElementById(elID);
    if (!!!el) return;
    const viewHeight = window.innerHeight;
    const elOffTop = el.offsetTop;
    const marginBottom = 0;
    const newHeight = viewHeight - elOffTop - marginBottom;
    el.style.height = newHeight + "px";
  };

  const sortedFlights = flights !== null ? [...flights] : [];

  const toursStrings = Array.from(
    new Set(props.tours.map((tour) => tour.category + " - " + tour.name))
  );

  return (
    <div className="root-container">
      <div className="mb-3 mx-8">
        <table>
          <tbody>
            <tr>
              <td>
                <Link className="inline-link" to="/">
                  <div className="p-3 interactive interactive-shadow">
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </div>
                </Link>
              </td>
              <td>
                <div className="ml-3">
                  <h3>Flight Center</h3>
                  <h2 className="color-accent-bkg">Search Tours</h2>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="groupbox mb-3 p-3 mx-8">
        <div className="grid grid-cols-4">
          <div className="col-span-1 pr-1">
            <Autocomplete
              placeholder="Tours"
              options={toursStrings}
              value={tour}
              onChange={(e) => {
                setTour(e);
              }}
              required={true}
            />
          </div>
        </div>
      </div>

      <div className="mx-8 mt-3">
        <h4>
          {sortedFlights.length > 0
            ? sortedFlights.length >= 100
              ? "100+ Flights Found"
              : sortedFlights.length > 1
              ? sortedFlights.length + " Flights Found"
              : "1 Flight Found"
            : "No Flights Found"}
        </h4>
      </div>

      <div
        ref={widthRef}
        className="grid grid-cols-10 data-table-header p-3 mt-3 mx-8"
      >
        <div className="col-span-2 interactive">Callsign</div>
        <div className="text-left interactive">Departure</div>
        <div className="text-left interactive">Arrival</div>
        <div className="text-left interactive">Schedule</div>
        <div className="text-left interactive">Duration</div>
        <div className="text-left interactive">Aircraft</div>
        <div className="text-right col-span-2"></div>
      </div>

      <div id="tblBody" className="overflow-y-auto pl-8">
        {props.aircraft.length > 0 && sortedFlights.length > 0 ? (
          sortedFlights.map((flight) => (
            <div style={{ width: `${width}px` }} key={flight.id}>
              <Flight
                key={flight.id}
                airports={props.airports}
                aircraft={props.aircraft}
                setExpandedFlight={setExpandedFlight}
                expanded={expandedFlight === flight.id}
                flight={
                  props.pluginSettings?.allow_any_aircraft_in_fleet
                    ? {
                        ...flight,
                        aircraft: [],
                        defaultAircraft: flight.aircraft,
                      }
                    : flight
                }
                simBriefInstalled={simBriefInstalled}
                currentFlightData={props.currentFlightData}
                source="tour"
              />
            </div>
          ))
        ) : (
          <div className="data-table-row p-3 mt-3 mr-8">
            No flights matching the search parameters were found.
          </div>
        )}
      </div>
    </div>
  );
};

const SearchTours = ({ identity, currentFlightData }) => {
  const [airports, setAirports] = useState([]);
  const [tours, setTours] = useState([]);
  const [aircraft, setAircraft] = useState([]);

  const pluginData = identity?.airline?.plugins?.find(
    (p) => p.id === "com.canadaairvirtual.flight-center"
  );

  const getTours = async () => {
    try {
      const response = await request({
        url: `${baseUrl}tours`,
        method: "GET",
      });
      setTours(response);
    } catch (error) {
      notify("com.canadaairvirtual.flight-center", null, null, {
        message: "Failed to fetch tours",
        type: "danger",
      });
    }
  };

  const getAirports = async () => {
    try {
      const response = await request({
        url: `${baseUrl}airports`,
        method: "GET",
      });
      setAirports(response);
    } catch (error) {
      notify("com.canadaairvirtual.flight-center", null, null, {
        message: "Failed to fetch airports",
        type: "danger",
      });
    }
  };

  const getAircraft = async () => {
    try {
      const response = await request({
        url: `${baseUrl}aircrafts`,
        method: "GET",
      });

      response.sort((a, b) => a.name.localeCompare(b.name));

      setAircraft(response);
    } catch (error) {
      notify("com.canadaairvirtual.flight-center", null, null, {
        message: "Failed to fetch aircraft",
        type: "danger",
      });
    }
  };

  useEffect(() => {
    getTours();
    getAircraft();
    getAirports();
  }, []);

  return (
    <SearchToursContent
      tours={tours}
      airports={airports}
      aircraft={aircraft}
      pluginSettings={pluginData?.appliedSettings}
      currentFlightData={currentFlightData}
    />
  );
};

export default SearchTours;
