import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import styled, { keyframes, css } from 'styled-components';
import { NavigationArrowIcon } from '@phosphor-icons/react/dist/csr/NavigationArrow';
import { GpsSlashIcon } from '@phosphor-icons/react/dist/csr/GpsSlash';
import { useMobilePress } from '../../src/hooks/useMobilePress';
import { useTranslation } from '../../src/translations';

export type LocateState = 'idle' | 'locating' | 'following' | 'tracking' | 'error';

// ─── Button ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  transform-origin: bottom right;
  transition: transform 0.1s ease-out;
  cursor: pointer;
`;

const slideIn = keyframes`
  0%   { opacity: 0; transform: translateX(11px) scale(0.93); }
  60%  { opacity: 1; transform: translateX(-3px) scale(1.02); }
  80%  { transform: translateX(1px) scale(0.99); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
`;

const ErrorLabel = styled.div<{ $visible: boolean }>`
  background-color: ${({ theme }) => theme.colors.text.primary};
  color: ${({ theme }) => theme.colors.background.primary};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 0 16px;
  height: 44px;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.35s ease;
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
  ${({ $visible }) => $visible && css`animation: ${slideIn} 0.3s ease-out forwards;`}
`;

const Button = styled.button<{ $following: boolean; $error: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s, background-color 0.1s;
  background-color: ${({ theme }) => theme.colors.background.primary};
  color: ${({ $following, $error, theme }) =>
    $error     ? theme.status.error :
    $following ? theme.header.progressBar.highlightColor :
                 theme.colors.text.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  outline: none;
  -webkit-tap-highlight-color: transparent;

  @media (hover: hover) {
    &:hover {
      background-color: ${({ theme }) => theme.colors.background.secondary};
    }
  }
`;

interface MapLocateButtonProps {
  locateState: LocateState;
  onLocate: () => void;
}

export const MapLocateButton: React.FC<MapLocateButtonProps> = ({ locateState, onLocate }) => {
  const isFollowing = locateState === 'following';
  const isError     = locateState === 'error';
  const handlePress = useMobilePress();
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [labelVisible, setLabelVisible] = useState(false);
  const [labelMounted, setLabelMounted] = useState(false);

  useEffect(() => {
    if (!isError) {
      setLabelVisible(false);
      // labelMounted goes false via onTransitionEnd
      return;
    }
    setLabelMounted(true);
    // Small delay so the mount happens before opacity animates in
    const show = requestAnimationFrame(() => setLabelVisible(true));
    const hide = setTimeout(() => setLabelVisible(false), 4000);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); };
  }, [isError]);

  const handleWrapperPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
  }, []);

  return (
    <Wrapper ref={wrapperRef} onPointerDown={handleWrapperPointerDown}>
      {labelMounted && (
        <ErrorLabel
          $visible={labelVisible}
          onTransitionEnd={() => { if (!labelVisible) setLabelMounted(false); }}
        >
          {t.map.locationError}
        </ErrorLabel>
      )}
      <Button
        onPointerDown={e => handlePress(e, onLocate)}
        $following={isFollowing}
        $error={isError}
        aria-label="Show my location"
      >
        {isError
          ? <GpsSlashIcon size={20} weight="bold" />
          : <NavigationArrowIcon size={20} weight={isFollowing ? 'fill' : 'bold'} />
        }
      </Button>
    </Wrapper>
  );
};

// ─── UserLocationLayer (must be inside MapContainer) ─────────────────────────

interface UserLocationLayerProps {
  position: { lat: number; lng: number } | null;
  shouldCenter: boolean;
  onCentered: () => void;
  onUserMoved: () => void;
  dotColor?: string;
  borderColor?: string;
}

export const UserLocationLayer: React.FC<UserLocationLayerProps> = ({
  position,
  shouldCenter,
  onCentered,
  onUserMoved,
  dotColor = '#3B82F6',
  borderColor = '#FFFFFF',
}) => {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  // Listen for user-initiated drag to disengage follow mode
  useEffect(() => {
    map.on('dragstart', onUserMoved);
    return () => { map.off('dragstart', onUserMoved); };
  }, [map, onUserMoved]);

  // Update / create the pulsing dot
  useEffect(() => {
    if (!position) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const icon = L.divIcon({
      html: `
        <div style="position:relative;width:32px;height:32px">
          <div class="map-location-pulse" style="position:absolute;inset:0;border-radius:50%;background:${dotColor}"></div>
          <div style="position:absolute;inset:4px;border-radius:50%;background:${dotColor};border:3px solid ${borderColor};box-shadow:0 0 10px ${dotColor}99"></div>
        </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lng]);
      markerRef.current.setIcon(icon);
    } else {
      markerRef.current = L.marker([position.lat, position.lng], {
        icon,
        zIndexOffset: 500,
      }).addTo(map);
    }
  }, [map, position]);

  // Fly to user position when requested — immediately call onCentered so the
  // icon switches to filled without waiting for the animation to finish
  useEffect(() => {
    if (!shouldCenter || !position) return;
    map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    onCentered();
  }, [shouldCenter, position, map, onCentered]);

  useEffect(() => () => { markerRef.current?.remove(); }, []);

  return null;
};

// ─── useUserLocation hook ─────────────────────────────────────────────────────

export function useUserLocation() {
  const [locateState, setLocateState]     = useState<LocateState>('idle');
  const [userLocation, setUserLocation]   = useState<{ lat: number; lng: number } | null>(null);
  const [shouldCenter, setShouldCenter]   = useState(false);
  const watchIdRef     = useRef<number | null>(null);
  const isFirstFixRef  = useRef(true);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => () => stopWatching(), [stopWatching]);

  const handleLocate = useCallback((currentState: LocateState, currentLocation: { lat: number; lng: number } | null) => {
    if (!navigator.geolocation) {
      setLocateState('error');
      return;
    }

    // Following (full arrow) — toggle off: hide dot and reset to idle
    if (currentState === 'following') {
      stopWatching();
      setUserLocation(null);
      setLocateState('idle');
      return;
    }

    // Tracking (panned away) — re-center and resume following
    if (currentState === 'tracking' && currentLocation) {
      setShouldCenter(true);
      setLocateState('following');
      return;
    }

    // Retry after error or start fresh
    stopWatching();
    setLocateState('locating');
    isFirstFixRef.current = true;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (isFirstFixRef.current) {
          isFirstFixRef.current = false;
          setShouldCenter(true);
          setLocateState('following');
        }
      },
      () => {
        setLocateState('error');
        stopWatching();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [stopWatching]);

  // Called when map fly-to initiates (icon switches to filled immediately)
  const handleCentered = useCallback(() => {
    setShouldCenter(false);
    setLocateState('following');
  }, []);

  // Called when the user drags the map — disengage follow mode
  const handleUserMoved = useCallback(() => {
    setLocateState(prev => prev === 'following' ? 'tracking' : prev);
  }, []);

  return {
    locateState,
    userLocation,
    shouldCenter,
    handleLocate,
    handleCentered,
    handleUserMoved,
  };
}
