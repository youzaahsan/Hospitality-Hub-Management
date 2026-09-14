import React, { useState, useEffect } from 'react';
import {
  Crown,
  Calendar,
  Users as UsersIcon,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Star,
  Coffee,
  Utensils,
  Wine,
  Waves,
  Car,
  Check,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { RoomType, FeedbackItem } from '../../types';
import { api } from '../../services/api';
import { BookingModal } from './BookingModal';
import { useAuth } from '../../context/AuthContext';

interface PublicWebsiteProps {
  onOpenPortal: () => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ onOpenPortal }) => {
  const { user, quickDemoLogin } = useAuth();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Bar State
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [selectedSuiteForBooking, setSelectedSuiteForBooking] = useState<RoomType | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [typesRes, fbRes] = await Promise.all([
          api.get<{ success: boolean; data: RoomType[] }>('/room-types'),
          api.get<{ success: boolean; data: FeedbackItem[] }>('/feedback'),
        ]);
        if (typesRes.success) setRoomTypes(typesRes.data);
        if (fbRes.success) setFeedbacks(fbRes.data);
      } catch (err) {
        console.error('Failed to load public website data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBookSuite = (suite: RoomType) => {
    setSelectedSuiteForBooking(suite);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 font-sans">
      {/* Top Luxury Announcement */}
      <div className="bg-zinc-950 text-amber-300 text-xs py-2 px-4 text-center font-medium tracking-widest uppercase flex items-center justify-center gap-2 border-b border-zinc-800">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        Condé Nast Gold List 2026 • Best Riviera Luxury Destination & Spa
      </div>

      {/* Main Luxury Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-amber-400 shadow-md">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-zinc-950 tracking-wider block">
                THE GRAND IMPERIAL
              </span>
              <span className="text-[10px] text-amber-800 tracking-widest uppercase font-semibold block">
                HOTEL, SUITES & PRIVATE RESIDENCES
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-zinc-600">
            <a href="#suites" className="hover:text-amber-700 transition-colors">
              Suites & Villas
            </a>
            <a href="#dining" className="hover:text-amber-700 transition-colors">
              Michelin Dining
            </a>
            <a href="#spa" className="hover:text-amber-700 transition-colors">
              Imperial Wellness
            </a>
            <a href="#reviews" className="hover:text-amber-700 transition-colors">
              Guest Stories
            </a>
          </nav>

          {/* Right Action: Portal or Login */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenPortal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>{user ? `Staff Portal (${user.role})` : 'PMS Management & Sign In'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Cinematic Hero Section */}
      <section className="relative h-[85vh] min-h-[580px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2000')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-zinc-950/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs uppercase tracking-widest font-semibold mb-6">
            <Crown className="w-3.5 h-3.5" />
            Palace Distinction Sanctuary
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-light tracking-tight leading-tight drop-shadow-md">
            Unrivaled Elegance <br />
            <span className="font-serif italic font-normal text-amber-200">on the Azure Coast</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-zinc-300 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Discover a sanctuary of peerless luxury, tailored Michelin-starred culinary artistry,
            and dedicated imperial butler service overlooking Mediterranean waters.
          </p>

          {/* Quick Demo Accounts Banner for easy testing */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 bg-zinc-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-zinc-700/60 shadow-lg text-xs">
            <span className="text-amber-400 font-semibold uppercase tracking-wider text-[11px]">
              Instant Role Demo:
            </span>
            <button
              onClick={() => quickDemoLogin('admin')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => quickDemoLogin('manager')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
            >
              Manager
            </button>
            <button
              onClick={() => quickDemoLogin('receptionist')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
            >
              Receptionist
            </button>
            <button
              onClick={() => quickDemoLogin('housekeeping')}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
            >
              Housekeeping
            </button>
            <button
              onClick={() => quickDemoLogin('guest')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-md transition-colors"
            >
              Guest Portal
            </button>
          </div>
        </div>

        {/* Live Floating Booking Search Widget */}
        <div className="absolute bottom-6 left-4 right-4 max-w-5xl mx-auto z-20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-zinc-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                Check-in Date
              </label>
              <div className="flex items-center border border-zinc-300 rounded-xl px-3 py-2 bg-zinc-50">
                <Calendar className="w-4 h-4 text-amber-700 mr-2 shrink-0" />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-zinc-900 focus:outline-hidden w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                Check-out Date
              </label>
              <div className="flex items-center border border-zinc-300 rounded-xl px-3 py-2 bg-zinc-50">
                <Calendar className="w-4 h-4 text-amber-700 mr-2 shrink-0" />
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-zinc-900 focus:outline-hidden w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                Guests & Suite
              </label>
              <div className="flex items-center border border-zinc-300 rounded-xl px-3 py-2 bg-zinc-50">
                <UsersIcon className="w-4 h-4 text-amber-700 mr-2 shrink-0" />
                <select className="bg-transparent text-xs font-semibold text-zinc-900 focus:outline-hidden w-full">
                  <option>2 Adults, 1 Suite</option>
                  <option>1 Adult, 1 Suite</option>
                  <option>3 Adults, Family Suite</option>
                  <option>4 Adults, Imperial Villa</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (roomTypes.length > 0) handleBookSuite(roomTypes[0]);
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs tracking-wider uppercase py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Check Availability & Book</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Suites & Residences Catalog */}
      <section id="suites" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-amber-800 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-1 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Signature Living
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-zinc-950">
            Suites, Penthouses & Private Villas
          </h2>
          <p className="mt-3 text-sm text-zinc-600 font-normal leading-relaxed">
            Each residence is meticulously designed with hand-loomed linens, private marble baths,
            and panoramic views across private Mediterranean coves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roomTypes.map((suite) => (
            <div
              key={suite._id}
              className="bg-white rounded-2xl overflow-hidden border border-zinc-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Image with Tag */}
              <div className="relative h-64 overflow-hidden bg-zinc-100">
                <img
                  src={suite.images[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'}
                  alt={suite.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                  ${suite.basePrice}{' '}
                  <span className="text-[10px] text-zinc-300 font-normal">/ night</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-zinc-800 text-[11px] font-medium px-2.5 py-0.5 rounded-md">
                  {suite.sizeSqFt} sq ft • {suite.bedType}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-semibold text-zinc-900">{suite.name}</h3>
                  <p className="text-xs text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
                    {suite.description}
                  </p>

                  {/* Amenities Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {suite.amenities.slice(0, 4).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full font-medium"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Max {suite.capacity} Guests</span>
                  <button
                    onClick={() => handleBookSuite(suite)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Reserve</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Culinary & Spa Showcase */}
      <section id="dining" className="py-20 bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-amber-400 text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-2">
                <Utensils className="w-3.5 h-3.5" />
                Gastronomy & Wine Folio
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-light leading-tight">
                Two-Star Michelin Dining <br />
                <span className="italic text-amber-200">Curated by Chef Antoine Mercier</span>
              </h2>
              <p className="mt-4 text-sm text-zinc-400 font-light leading-relaxed">
                Experience Mediterranean seafood, black winter truffles, and Grand Cru vintages served
                either in our seaside salon or through our 24-hour white-glove In-Suite Dining service.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <Wine className="w-5 h-5 text-amber-400 mb-2" />
                  <div className="font-semibold text-zinc-200">1,800-Bottle Cellar</div>
                  <div className="text-zinc-500 mt-1">Sommelier tasting available on request.</div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <Waves className="w-5 h-5 text-amber-400 mb-2" />
                  <div className="font-semibold text-zinc-200">Imperial Thalasso Spa</div>
                  <div className="text-zinc-500 mt-1">Heated saltwater infinity hydrotherapy.</div>
                </div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 h-[420px]">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200"
                alt="Imperial Dining"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Guest Reviews & Accolades */}
      <section id="reviews" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-16">
          <div className="text-amber-800 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-1 mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            Verified Guest Impressions
          </div>
          <h2 className="text-3xl font-serif font-light text-zinc-950">
            Unfiltered Reflections of Perfection
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feedbacks.slice(0, 3).map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-1 text-amber-500 mb-3">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <h4 className="text-base font-serif font-semibold text-zinc-900">"{item.title}"</h4>
                <p className="text-xs text-zinc-600 mt-2 italic leading-relaxed">
                  "{item.comment}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900">{item.guestName}</span>
                <span className="text-zinc-400">
                  {new Date(item.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-400 text-xs py-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="font-serif font-bold text-white text-sm tracking-wider">
              THE GRAND IMPERIAL & SPA
            </span>
          </div>
          <p>© 2026 The Grand Imperial Hotel & Residences. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <button onClick={onOpenPortal} className="text-amber-400 hover:underline">
              Enter Staff PMS
            </button>
          </div>
        </div>
      </footer>

      {/* Direct Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        selectedRoomType={selectedSuiteForBooking}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        onBookingSuccess={() => {
          // Booking successful!
        }}
      />
    </div>
  );
};
