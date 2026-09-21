"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair } from "lucide-react";

interface LeafletMapInnerProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  victimName?: string;
  isDistress?: boolean;
}

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

export default function LeafletMapInner({
  latitude,
  longitude,
  accuracy = 5,
  victimName = "Civilian Location",
  isDistress = false,
}: LeafletMapInnerProps) {
  // Custom tactical pin icon
  const customIcon = L.divIcon({
    className: "custom-tactical-pin",
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: ${
          isDistress ? "rgba(239, 68, 68, 0.4)" : "rgba(6, 182, 212, 0.4)"
        }; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 16px; height: 16px; border-radius: 50%; background-color: ${
          isDistress ? "#EF4444" : "#06B6D4"
        }; border: 2px solid #FFFFFF; box-shadow: 0 0 10px ${
      isDistress ? "#EF4444" : "#06B6D4"
    };"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", background: "#0B0F19" }}
      >
        <RecenterMap lat={latitude} lng={longitude} />
        {/* CartoDB Dark Matter tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Circle
          center={[latitude, longitude]}
          radius={accuracy * 2}
          pathOptions={{
            color: isDistress ? "#EF4444" : "#06B6D4",
            fillColor: isDistress ? "#EF4444" : "#06B6D4",
            fillOpacity: 0.15,
            weight: 1,
            dashArray: "4, 4",
          }}
        />
        <Marker position={[latitude, longitude]} icon={customIcon}>
          <Popup className="dark-popup">
            <div className="text-slate-900 font-sans p-1">
              <strong className="block text-xs font-bold text-slate-950">
                {victimName}
              </strong>
              <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
              <div
                className={`text-[10px] font-bold mt-1 uppercase ${
                  isDistress ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {isDistress ? "Active Emergency Distress" : "Arm-Escorted Active"}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Tactical HUD Overlay on Map */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#0F172A]/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 shadow-xl font-mono text-[11px] space-y-1">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>GPS Fix: Active</span>
        </div>
        <div className="text-slate-200">
          LAT: <span className="text-cyan-300 font-semibold">{latitude.toFixed(6)}</span>
        </div>
        <div className="text-slate-200">
          LNG: <span className="text-cyan-300 font-semibold">{longitude.toFixed(6)}</span>
        </div>
        <div className="text-slate-400 text-[10px]">
          Radius Accuracy: &plusmn;{accuracy}m
        </div>
      </div>
    </div>
  );
}
