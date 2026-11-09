import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, Route, Utensils } from "lucide-react";
import {
  CharityToken,
  COMMUNITY_KITCHENS,
  CUSTOMER_DELIVERY_GEO,
  DELIVERY_HUBS_GEO,
  DeliveryHubRouteGeo,
  getDeliveryRouteForLocation,
} from "../data/mealProgram";
import type {
  TrackingCoordinates,
  TrackingData,
} from "../services/trackingService";
import { formatCoordinates, hasCoordinates } from "./deliveryRouteMap/coordinates";
import {
  MapModeSwitcher,
  type MapFilterMode,
} from "./deliveryRouteMap/MapModeSwitcher";

function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const earthRadiusKm = 6371;
  const deltaLatitude = ((latitude2 - latitude1) * Math.PI) / 180;
  const deltaLongitude = ((longitude2 - longitude1) * Math.PI) / 180;
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos((latitude1 * Math.PI) / 180) *
      Math.cos((latitude2 * Math.PI) / 180) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

interface DeliveryRouteMapProps {
  token: CharityToken;
  overrideLocation?: string;
  overrideBeneficiaryId?: string;
  onSelectHubLocation?: (hubName: string, beneficiaryCode: string) => void;
  liveTracking?: TrackingData;
}

export const DeliveryRouteMap: React.FC<DeliveryRouteMapProps> = ({
  token,
  overrideLocation,
  overrideBeneficiaryId,
  onSelectHubLocation,
  liveTracking,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapMode, setMapMode] = useState<MapFilterMode>("DUAL_PATHS");
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [customerRoute, setCustomerRoute] = useState<[number, number][]>([]);
  const [sponsoredRoute, setSponsoredRoute] = useState<[number, number][]>([]);
  const [resolvedKitchenLocation, setResolvedKitchenLocation] =
    useState<TrackingCoordinates | null>(null);
  const [kitchenGeocodeStatus, setKitchenGeocodeStatus] = useState<
    "idle" | "loading" | "resolved" | "unavailable" | "failed"
  >("idle");

  const effectiveLocation = overrideLocation || token.deliveryLocation;
  const effectiveBeneficiary = overrideBeneficiaryId || token.beneficiaryId;

  const activeHubRoute: DeliveryHubRouteGeo = getDeliveryRouteForLocation(
    effectiveLocation,
    effectiveBeneficiary,
  );

  const originKitchen =
    COMMUNITY_KITCHENS.find((k) => k.id === activeHubRoute.kitchenId) ||
    COMMUNITY_KITCHENS[0];

  const isDelivered = token.status === "DELIVERED";
  const kitchenCoordinates = hasCoordinates(liveTracking?.kitchen?.location)
    ? liveTracking.kitchen.location
    : resolvedKitchenLocation;
  const liveRouteDistance = useMemo(() => {
    const destination = liveTracking?.destination;
    if (!hasCoordinates(kitchenCoordinates) || !hasCoordinates(destination)) {
      return "Not available";
    }

    return `${calculateDistanceKm(
      kitchenCoordinates.latitude,
      kitchenCoordinates.longitude,
      destination.latitude,
      destination.longitude,
    ).toFixed(1)} km`;
  }, [kitchenCoordinates, liveTracking?.destination]);

  useEffect(() => {
    const address = liveTracking?.kitchen?.address?.trim();
    if (
      !liveTracking ||
      hasCoordinates(liveTracking.kitchen?.location) ||
      !address
    ) {
      setResolvedKitchenLocation(null);
      setKitchenGeocodeStatus("idle");
      return;
    }

    const controller = new AbortController();
    const resolveAddress = async () => {
      setResolvedKitchenLocation(null);
      setKitchenGeocodeStatus("loading");
      try {
        const query = encodeURIComponent(`${address}, Hyderabad, India`);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`,
          { signal: controller.signal, headers: { "Accept-Language": "en" } },
        );
        if (!response.ok) {
          throw new Error(`Kitchen address lookup failed (${response.status})`);
        }

        const results: Array<{ lat: string; lon: string }> =
          await response.json();
        const latitude = Number(results[0]?.lat);
        const longitude = Number(results[0]?.lon);
        const coordinates = { latitude, longitude };
        if (!hasCoordinates(coordinates)) {
          setResolvedKitchenLocation(null);
          setKitchenGeocodeStatus("unavailable");
          return;
        }

        setResolvedKitchenLocation(coordinates);
        setKitchenGeocodeStatus("resolved");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Kitchen address lookup error:", error);
        setKitchenGeocodeStatus("failed");
      }
    };

    resolveAddress();
    return () => controller.abort();
  }, [
    liveTracking?.kitchen?.address,
    liveTracking?.kitchen?.location,
    liveTracking,
  ]);

  const fetchOSRMRoute = async (
    from: [number, number],
    to: [number, number],
  ) => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`,
      );
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        return data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]],
        );
      }
      return [from, to];
    } catch (err) {
      console.error("OSRM route error:", err);
      return [from, to];
    }
  };

  useEffect(() => {
    if (liveTracking) return;
    const loadRoutes = async () => {
      if (mapMode === "DUAL_PATHS") {
        const route = await fetchOSRMRoute(
          originKitchen.coords,
          CUSTOMER_DELIVERY_GEO.coords,
        );
        setCustomerRoute(route);
      }
      if (mapMode !== "ALL_NETWORK") {
        const route = await fetchOSRMRoute(
          originKitchen.coords,
          activeHubRoute.coords,
        );
        setSponsoredRoute(route);
      }
    };
    loadRoutes();
  }, [mapMode, originKitchen, activeHubRoute, liveTracking]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [17.418, 78.478],
      zoom: 12,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: "abc",
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Fix initial tile rendering and floating sizing bugs
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false, debounceMoveend: true });
      });
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      cancelAnimationFrame(resizeFrame);
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const boundsPoints: [number, number][] = [];

    if (liveTracking) {
      const addLiveMarker = (
        location: TrackingCoordinates | null | undefined,
        tooltipContent: string | HTMLElement,
        color: string,
        popup?: HTMLElement,
      ) => {
        if (!hasCoordinates(location)) return;
        const point: [number, number] = [location.latitude, location.longitude];
        boundsPoints.push(point);
        const marker = L.circleMarker(point, {
          radius: 9,
          color: "#080808",
          weight: 3,
          fillColor: color,
          fillOpacity: 1,
        });
        const tooltip =
          typeof tooltipContent === "string"
            ? document.createElement("span")
            : tooltipContent;
        if (typeof tooltipContent === "string")
          tooltip.textContent = tooltipContent;
        marker.bindTooltip(tooltip);
        if (popup) marker.bindPopup(popup);
        marker.addTo(layerGroup);
      };

      const kitchen = liveTracking.kitchen;
      if (kitchenCoordinates) {
        const tooltip = document.createElement("div");
        const tooltipName = document.createElement("strong");
        tooltipName.textContent = kitchen?.name || "Kitchen location";
        tooltip.append(tooltipName);
        if (kitchen?.address) {
          const tooltipAddress = document.createElement("div");
          tooltipAddress.textContent = kitchen.address;
          tooltip.append(tooltipAddress);
        }
        if (kitchen?._id) {
          const tooltipId = document.createElement("div");
          tooltipId.textContent = `Kitchen ID: ${kitchen._id}`;
          tooltip.append(tooltipId);
        }

        const popup = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = kitchen?.name || "Kitchen location";
        popup.append(name);
        if (kitchen?.address) {
          const address = document.createElement("p");
          address.textContent = kitchen.address;
          popup.append(address);
        }
        if (kitchen?._id) {
          const id = document.createElement("p");
          id.textContent = `Kitchen ID: ${kitchen._id}`;
          popup.append(id);
        }
        addLiveMarker(kitchenCoordinates, tooltip, "#4EDBE2", popup);
      }
      addLiveMarker(
        liveTracking.rider?.currentLocation,
        "Delivery rider",
        "#f97316",
      );
      const destinationLabel = `${liveTracking.customerName || "Donor"} destination`;
      const destinationPopup = document.createElement("div");
      const destinationName = document.createElement("strong");
      destinationName.textContent = destinationLabel;
      destinationPopup.append(destinationName);
      addLiveMarker(
        liveTracking.destination,
        destinationLabel,
        "#a78bfa",
        destinationPopup,
      );

      const apiRoutes = [
        liveTracking.routes?.toKitchen,
        liveTracking.routes?.toCustomer ?? liveTracking.route,
      ];
      apiRoutes.forEach((route, index) => {
        const path = route?.path?.filter(
          ([latitude, longitude]) =>
            Number.isFinite(latitude) && Number.isFinite(longitude),
        );
        if (!path || path.length < 2) return;
        boundsPoints.push(...path);
        L.polyline(path, {
          color: index === 0 ? "#4EDBE2" : "#49E619",
          weight: 4,
          opacity: 0.9,
        }).addTo(layerGroup);
      });

      if (boundsPoints.length > 1) {
        map.fitBounds(L.latLngBounds(boundsPoints), {
          padding: [44, 44],
          maxZoom: 14,
        });
      } else if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 13);
      }
      return;
    }

    // 1. Render Community Kitchens
    const kitchensToRender =
      mapMode === "ALL_NETWORK" ? COMMUNITY_KITCHENS : [originKitchen];

    kitchensToRender.forEach((kitchen) => {
      const isPrimaryOrigin = kitchen.id === originKitchen.id;
      boundsPoints.push(kitchen.coords);

      const dotColorClass = isPrimaryOrigin ? "bg-[#49E619]" : "bg-[#F2F4F3]";
      const kitchenIcon = L.divIcon({
        className: "bg-transparent border-0",
        html: `
          <div class="inline-flex items-center gap-1.5 rounded-[6px] bg-[#080808] text-white px-2.5 py-1 border-2 border-white shadow-lg font-mono-tabular text-[10px] font-bold tracking-wider whitespace-nowrap -translate-x-1/2 -translate-y-1/2">
            <span class="w-2 h-2 rounded-full ${dotColorClass} inline-block"></span>
            <span>${kitchen.code}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(kitchen.coords, { icon: kitchenIcon });
      marker.bindPopup(`
        <div class="min-w-[210px]">
          <div class="font-mono-tabular text-[10px] uppercase tracking-widest text-[#188D44] font-bold">
            ORIGIN COMMUNITY KITCHEN
          </div>
          <div class="font-display-sans uppercase text-sm font-black text-[#080808] mt-0.5">
            ${kitchen.name}
          </div>
          <div class="text-[11px] text-[#6F6F6F] mt-1">
            ${kitchen.address}
          </div>
          <div class="mt-2 pt-1.5 border-t border-[#080808]/10 font-mono-tabular text-[10px] text-[#080808]">
            <strong>Capacity:</strong> ${kitchen.dailyCapacity}<br/>
            <strong>Hours:</strong> ${kitchen.operatingHours}
          </div>
        </div>
      `);
      marker.addTo(layerGroup);
    });

    // 2. Render Customer's Own Purchased Meal Route (Stream 1)
    if (mapMode === "DUAL_PATHS") {
      customerRoute.forEach((pt) => boundsPoints.push(pt));

      L.polyline(customerRoute, {
        color: "#122023",
        weight: 3,
        opacity: 0.85,
        dashArray: "6, 8",
      }).addTo(layerGroup);

      const customerIcon = L.divIcon({
        className: "bg-transparent border-0",
        html: `
          <div class="inline-flex items-center gap-1.5 rounded-[6px] bg-[#4EDBE2] text-[#122023] px-2.5 py-1 border-2 border-[#122023] shadow-md font-mono-tabular text-[10px] font-bold tracking-wider whitespace-nowrap -translate-x-1/2 -translate-y-1/2">
            <span>MEAL 01 · YOUR DOORSTEP</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker(CUSTOMER_DELIVERY_GEO.coords, { icon: customerIcon })
        .bindPopup(
          `
          <div class="min-w-[200px]">
            <div class="font-mono-tabular text-[10px] uppercase tracking-widest text-[#188D44] font-bold">
              MEAL 01 · YOUR PURCHASED MEAL
            </div>
            <div class="font-display-sans uppercase text-sm font-black text-[#080808] mt-0.5">
              ${token.productName} (For ${token.customerName})
            </div>
            <div class="text-[11px] text-[#6F6F6F] mt-1">
              ${CUSTOMER_DELIVERY_GEO.label} · ${CUSTOMER_DELIVERY_GEO.distanceKm}
            </div>
            <div class="mt-1.5 font-mono-tabular text-[10px] text-[#188D44] font-bold">
              Status: ${
                token.customerMealStatus === "DELIVERED_TO_CUSTOMER"
                  ? "DELIVERED TO YOU ✓"
                  : "DISPATCHED FROM KITCHEN"
              }
            </div>
          </div>
        `,
        )
        .addTo(layerGroup);
    }

    // 3. Render Sponsored Child Meal Delivery Hubs & Paths (Stream 2)
    const hubsToRender =
      mapMode === "ALL_NETWORK" ? DELIVERY_HUBS_GEO : [activeHubRoute];

    hubsToRender.forEach((hub) => {
      const isTargetHub = hub.id === activeHubRoute.id;
      const routeToUse = isTargetHub ? sponsoredRoute : hub.routeWaypoints;
      routeToUse.forEach((pt) => boundsPoints.push(pt));

      L.polyline(routeToUse, {
        color: isTargetHub ? "#188D44" : "#122023",
        weight: isTargetHub ? 5 : 2,
        opacity: isTargetHub ? 0.95 : 0.35,
        dashArray: isTargetHub ? undefined : "4, 6",
      }).addTo(layerGroup);

      if (isTargetHub) {
        L.polyline(sponsoredRoute, {
          color: "#B9FF2C",
          weight: 2.5,
          opacity: 0.95,
          dashArray: "6, 12",
          className: "leaflet-SponsorRoute-animated",
        }).addTo(layerGroup);

        sponsoredRoute.slice(1, -1).forEach((waypoint, idx) => {
          L.circleMarker(waypoint, {
            radius: 4,
            color: "#122023",
            weight: 1.5,
            fillColor: "#49E619",
            fillOpacity: 1,
          })
            .bindTooltip(
              `Checkpoint 0${idx + 1} · Thermal Sealed (${hub.thermalTempCelsius})`,
              { direction: "top" },
            )
            .addTo(layerGroup);
        });
      }

      if (isTargetHub && !isDelivered) {
        const vanIcon = L.divIcon({
          className: "bg-transparent border-0",
          html: `
            <div class="inline-flex items-center gap-1.5 rounded-[6px] bg-[#B9FF2C] text-[#122023] px-2 py-1 border-2 border-[#122023] shadow-md font-mono-tabular text-[10px] font-bold whitespace-nowrap -translate-x-1/2 -translate-y-1/2">
              <span class="text-[#188D44]">●</span>
              <span>THERMAL VAN · ${hub.thermalTempCelsius}</span>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker(hub.transitMidpoint, { icon: vanIcon })
          .bindPopup(
            `
            <div class="min-w-[190px]">
              <div class="font-mono-tabular text-[10px] text-[#188D44] font-bold">
                IN TRANSIT · ${hub.thermalBatchCode}
              </div>
              <div class="text-xs font-bold text-[#080808] mt-0.5">
                Sponsored Meal En Route to ${hub.hubName}
              </div>
              <div class="text-[11px] text-[#6F6F6F] mt-1">
                Thermal Container Temp: <strong>${hub.thermalTempCelsius}</strong>
              </div>
            </div>
          `,
          )
          .addTo(layerGroup);
      }

      const hubBadgeClasses = isTargetHub
        ? "bg-[#49E619] text-[#122023] border-[#122023] shadow-lg"
        : "bg-white text-[#122023] border-[#122023] shadow-sm";

      const hubIcon = L.divIcon({
        className: "bg-transparent border-0",
        html: `
          <div class="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 border-2 font-mono-tabular text-[10px] font-bold tracking-wider whitespace-nowrap -translate-x-1/2 -translate-y-1/2 ${hubBadgeClasses}">
            <span>${
              isTargetHub
                ? isDelivered
                  ? "❤️ CHILD RECEIVED"
                  : "MEAL 02 · TARGET HUB"
                : "COMMUNITY HUB"
            }</span>
            <span class="opacity-85">· ${hub.beneficiaryCode}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const hubMarker = L.marker(hub.coords, { icon: hubIcon });
      hubMarker.bindPopup(`
        <div class="min-w-[220px]">
          <div class="font-mono-tabular text-[10px] uppercase tracking-widest text-[#188D44] font-bold">
            MEAL 02 · SPONSORED CHILD HUB
          </div>
          <div class="font-display-sans uppercase text-sm font-black text-[#080808] mt-0.5">
            ${hub.hubName}
          </div>
          <div class="text-[11px] text-[#6F6F6F] mt-1">
            ${hub.region} · Distance: ${hub.distanceKm}
          </div>
          <div class="mt-2 pt-1.5 border-t border-[#080808]/10 font-mono-tabular text-[10px] text-[#080808]">
            <strong>Token:</strong> ${token.tokenNumber}<br/>
            <strong>Beneficiary ID:</strong> ${
              isTargetHub ? effectiveBeneficiary : hub.beneficiaryCode
            }<br/>
            <strong>Status:</strong> ${
              isTargetHub && isDelivered
                ? "DELIVERED & VERIFIED ❤️"
                : "ASSIGNED FOR DISTRIBUTION"
            }
          </div>
        </div>
      `);
      hubMarker.addTo(layerGroup);
    });

    if (boundsPoints.length > 1) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [44, 44], maxZoom: 14 });
    }
  }, [
    activeHubRoute,
    originKitchen,
    isDelivered,
    mapMode,
    kitchenCoordinates,
    token.tokenNumber,
    token.productName,
    token.customerName,
    token.customerMealStatus,
    effectiveBeneficiary,
    customerRoute,
    sponsoredRoute,
    liveTracking,
  ]);

  const handleFocusCoords = (coords: [number, number], hubId?: string) => {
    if (hubId) {
      setSelectedHubId(hubId);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, 14, { duration: 0.9 });
    }
  };

  const handleResetView = () => {
    setSelectedHubId(null);
    const map = mapInstanceRef.current;
    if (!map) return;
    const pts: [number, number][] = [...activeHubRoute.routeWaypoints];
    if (mapMode === "DUAL_PATHS") {
      pts.push(...CUSTOMER_DELIVERY_GEO.routeFromCentralKitchen);
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [44, 44], maxZoom: 14 });
  };

  return (
    <div className="rounded-[18px] bg-[#080808] border border-white/15 shadow-2xl overflow-hidden">
      {/* =====================================================================
          MAP HEADER & MODE CONTROLS
      ====================================================================== */}
      <div className="p-4 sm:p-6 border-b border-white/12 bg-[#080808] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {!liveTracking && (
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-[#49E619] shrink-0" />
              <span className="font-mono-tabular text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#49E619]">
                LIVE GEOSPATIAL DISPATCH LEDGER · HYDERABAD
              </span>
            </div>
          )}
          <h3 className="font-display-sans uppercase text-xl sm:text-3xl font-black text-white mt-1">
            {liveTracking
              ? liveTracking.orderNumber
              : "Community Kitchen & Delivery Path"}
          </h3>
          <p className="text-xs text-white/75 mt-1 leading-relaxed">
            {liveTracking ? (
              <>
                {liveTracking.kitchen?.name && (
                  <>
                    Prepared at{" "}
                    <strong className="text-white">
                      {liveTracking.kitchen.name}
                    </strong>
                  </>
                )}
                {liveTracking.customerMealStatus === "outfordelivery" &&
                  liveTracking.rider?.name && (
                    <>
                      {" "}
                      · Rider{" "}
                      <strong className="text-white">
                        {liveTracking.rider.name}
                      </strong>
                    </>
                  )}
              </>
            ) : (
              <>
                Tracing Token{" "}
                <strong className="font-mono-tabular text-[#B9FF2C]">
                  {token.tokenNumber}
                </strong>{" "}
                from{" "}
                <strong className="text-white">{originKitchen.name}</strong> to{" "}
                <strong className="text-[#49E619]">
                  {activeHubRoute.hubName}
                </strong>{" "}
                ({activeHubRoute.distanceKm}).
              </>
            )}
          </p>
        </div>

        {/* Interactive Layer Switcher */}
        {!liveTracking && (
          <MapModeSwitcher mapMode={mapMode} onChange={setMapMode} />
        )}
      </div>

      {/* =====================================================================
          MAP LEGEND BAR (DUAL-MEAL TRANSPARENCY)
      ====================================================================== */}
      <div className="px-4 sm:px-6 py-3 bg-[#122023] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        {liveTracking ? (
          <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#4EDBE2]">
                Kitchen
              </p>
              <p className="mt-1 text-xs font-semibold text-white">
                {liveTracking.kitchen?.name || "Kitchen details unavailable"}
              </p>
              {liveTracking.kitchen?._id && (
                <p className="mt-1 text-[11px] text-white/60">
                  Kitchen ID: {liveTracking.kitchen._id}
                </p>
              )}
              {liveTracking.kitchen?.address && (
                <p className="mt-1 text-[11px] text-white/60">
                  {liveTracking.kitchen.address}
                </p>
              )}
              <p className="mt-1 font-mono-tabular text-[10px] text-white/50">
                {formatCoordinates(kitchenCoordinates)}
                {!hasCoordinates(liveTracking.kitchen?.location) &&
                kitchenGeocodeStatus === "loading"
                  ? " · Locating on map"
                  : ""}
                {!hasCoordinates(liveTracking.kitchen?.location) &&
                kitchenGeocodeStatus === "unavailable"
                  ? " · Address could not be located"
                  : ""}
                {!hasCoordinates(liveTracking.kitchen?.location) &&
                kitchenGeocodeStatus === "failed"
                  ? " · Address lookup failed"
                  : ""}
              </p>
            </div>
            <div>
              <p className="font-mono-tabular text-[10px] uppercase tracking-widest text-white/65">
                Rider
              </p>
              <p className="mt-1 text-xs font-semibold text-white">
                {liveTracking.rider?.name || "Not assigned"}
              </p>
              {liveTracking.rider && (
                <p className="mt-1 font-mono-tabular text-[10px] text-white/60">
                  {formatCoordinates(liveTracking.rider.currentLocation)}
                  {liveTracking.rider.isLocationStale
                    ? " · Location may be stale"
                    : ""}
                </p>
              )}
            </div>
            <div>
              <p className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#a78bfa]">
                Donor destination
              </p>
              <p className="mt-1 text-xs font-semibold text-white">
                {liveTracking.customerName || "Donor"}
              </p>
              <p className="mt-1 font-mono-tabular text-[10px] text-white/60">
                {formatCoordinates(liveTracking.destination)}
              </p>
            </div>
            <div>
              <p className="font-mono-tabular text-[10px] uppercase tracking-widest text-white/65">
                Routes
              </p>

              <div className="mt-1 text-xs text-white/75">
                <p>From: {liveTracking.kitchen?.name || "Kitchen"}</p>
                <p>To: {liveTracking.customerName || "Customer"}</p>
                <p className="font-semibold text-white mt-1">
                  {liveRouteDistance}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#49E619] inline-block shrink-0" />
              <span className="font-mono-tabular text-[11px] text-white font-semibold">
                Origin: {originKitchen.code}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 sm:w-6 h-1 bg-[#49E619] inline-block shrink-0" />
              <span className="font-mono-tabular text-[11px] text-[#B9FF2C] font-bold">
                Sponsored Child Meal Path ({activeHubRoute.distanceKm})
              </span>
            </div>

            {mapMode === "DUAL_PATHS" && (
              <div className="flex items-center gap-2">
                <span className="w-5 sm:w-6 h-0.5 border-b-2 border-dashed border-[#4EDBE2] inline-block shrink-0" />
                <span className="font-mono-tabular text-[11px] text-[#4EDBE2] font-semibold">
                  Your Purchased Meal Path ({CUSTOMER_DELIVERY_GEO.distanceKm})
                </span>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (liveTracking) {
              const points: [number, number][] = [];
              [
                kitchenCoordinates,
                liveTracking.rider?.currentLocation,
                liveTracking.destination,
              ].forEach((location) => {
                if (hasCoordinates(location)) {
                  points.push([location.latitude, location.longitude]);
                }
              });
              [
                liveTracking.routes?.toKitchen?.path,
                (liveTracking.routes?.toCustomer ?? liveTracking.route)?.path,
              ].forEach((path) => path?.forEach((point) => points.push(point)));
              if (mapInstanceRef.current && points.length > 1) {
                mapInstanceRef.current.fitBounds(L.latLngBounds(points), {
                  padding: [44, 44],
                  maxZoom: 14,
                });
              } else if (mapInstanceRef.current && points[0]) {
                mapInstanceRef.current.setView(points[0], 13);
              }
            } else {
              handleResetView();
            }
          }}
          className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-white/75 hover:text-[#49E619] inline-flex items-center gap-1 cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-[#49E619] shrink-0" />
          <span>Reset Map Bounds</span>
        </button>
      </div>

      {/* =====================================================================
          LEAFLET INTERACTIVE CANVAS
      ====================================================================== */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-[320px] sm:h-[400px] lg:h-[440px] z-10"
          aria-label={
            liveTracking
              ? "Live order delivery map"
              : "Interactive map of Zero Hunger community kitchens and meal delivery routes in Hyderabad"
          }
        />

        {/* Floating Live Telemetry Overlay Badge */}
        {!liveTracking && (
          <div className="hidden sm:block absolute bottom-4 left-4 z-20 rounded-[12px] bg-[#080808]/92 backdrop-blur-xs text-white p-4 border border-white/15 max-w-xs shadow-xl pointer-events-none">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/15">
              <span className="font-mono-tabular text-[10px] uppercase tracking-widest text-[#49E619] font-bold">
                THERMAL CHAIN TELEMETRY
              </span>
              <span className="font-mono-tabular text-[10px] text-[#B9FF2C] font-bold">
                {activeHubRoute.thermalTempCelsius} SEALED
              </span>
            </div>
            <div className="mt-2.5 space-y-1 font-mono-tabular text-[11px]">
              <div className="flex justify-between gap-3">
                <span className="text-white/60">ORIGIN:</span>
                <span className="text-white font-semibold truncate">
                  Secunderabad Kitchen
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/60">DESTINATION:</span>
                <span className="text-[#49E619] font-bold truncate">
                  {activeHubRoute.hubName}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/60">BATCH / ETA:</span>
                <span className="text-white">
                  {activeHubRoute.thermalBatchCode} ·{" "}
                  {activeHubRoute.estimatedTransitMins}m
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          INTERACTIVE KITCHEN & HUB DIRECTORY CARDS BELOW MAP
      ====================================================================== */}
      {!liveTracking && (
        <div className="p-4 sm:p-6 bg-[#080808] border-t border-white/12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
              CLICK ANY KITCHEN OR COMMUNITY HUB TO INSPECT CORRIDOR ON MAP
            </span>
            <span className="font-mono-tabular text-[11px] font-bold text-[#49E619]">
              5 Active Nodes in Hyderabad
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Origin Kitchen Card */}
            <button
              type="button"
              onClick={() =>
                handleFocusCoords(originKitchen.coords, originKitchen.id)
              }
              className={`rounded-[12px] text-left p-3.5 border transition-all cursor-pointer ${
                selectedHubId === originKitchen.id
                  ? "bg-[#4EDBE2] text-[#122023] border-[#4EDBE2]"
                  : "bg-[#122023] text-white border-white/15 hover:border-[#4EDBE2]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider">
                  ORIGIN KITCHEN
                </span>
                <Utensils className="w-3.5 h-3.5 shrink-0" />
              </div>
              <div className="font-display-sans uppercase text-sm font-black mt-1 truncate">
                {originKitchen.name}
              </div>
              <div className="font-mono-tabular text-[11px] mt-1 opacity-75">
                {originKitchen.dailyCapacity}
              </div>
            </button>

            {/* 3 Community Distribution Hub Cards */}
            {DELIVERY_HUBS_GEO.map((hub) => {
              const isActiveHub = hub.id === activeHubRoute.id;
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => {
                    handleFocusCoords(hub.coords, hub.id);
                    if (onSelectHubLocation) {
                      onSelectHubLocation(hub.hubName, hub.beneficiaryCode);
                    }
                  }}
                  className={`rounded-[12px] text-left p-3.5 border transition-all cursor-pointer ${
                    isActiveHub
                      ? "bg-[#49E619] text-[#122023] border-[#49E619]"
                      : "bg-[#122023] text-white border-white/15 hover:border-[#49E619]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider">
                      {isActiveHub ? "● ASSIGNED HUB" : "COMMUNITY HUB"}
                    </span>
                    <span className="font-mono-tabular text-[10px] font-bold">
                      {hub.distanceKm}
                    </span>
                  </div>
                  <div className="font-display-sans uppercase text-sm font-black mt-1 truncate">
                    {hub.hubName}
                  </div>
                  <div className="font-mono-tabular text-[11px] opacity-80 mt-1 flex items-center justify-between">
                    <span>ID: {hub.beneficiaryCode}</span>
                    <span>{hub.estimatedTransitMins} mins</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
