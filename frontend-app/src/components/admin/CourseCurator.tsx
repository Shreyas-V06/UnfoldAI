import React, { useState } from 'react';
import { coursesApi } from '../../api/client';
import { CourseVideo } from '../../api/types';
import {
  Video,
  Search,
  Sparkles,
  ExternalLink,
  Loader2,
  Youtube,
  Play,
  Lightbulb,
} from 'lucide-react';

export const CourseCurator: React.FC = () => {
  const [topic, setTopic] = useState('Photosynthesis for visual learners');
  const [maxResults, setMaxResults] = useState(6);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [searchedTopic, setSearchedTopic] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const sampleTopics = [
    'Phonics blends for dyslexia',
    'Photosynthesis visual explanation',
    'Water cycle simplified',
    'Dyslexia reading strategies',
    'Fractions with visual models',
  ];

  const handleSearch = async (queryTopic?: string) => {
    const searchTarget = (queryTopic || topic).trim();
    if (!searchTarget || isSearching) return;

    try {
      setIsSearching(true);
      setSearchedTopic(searchTarget);
      const res = await coursesApi.generate(searchTarget, maxResults);
      setVideos(res.videos || []);
      setHasSearched(true);
    } catch (err: any) {
      console.error('Course curation search error:', err);
      alert(`Search error: ${err?.message || 'Failed to curate videos'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-rose-900/10 via-brand-900/10 to-indigo-900/10 rounded-3xl border border-rose-200 dark:border-rose-800/60 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
              AI YouTube Video Course Curator
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            Leverage AI to search and discover curated educational videos on any subject, creating visual and auditory supplemental courses for dyslexic students.
          </p>
        </div>

        {/* Search Bar & Options */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-3 pt-2"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter educational topic (e.g. Phoneme segmentation, Plant biology)..."
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs md:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-xs text-slate-600 dark:text-slate-300">
                <span>Count:</span>
                <select
                  value={maxResults}
                  onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
                  className="bg-transparent font-bold focus:outline-none cursor-pointer"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSearching || !topic.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm rounded-2xl shadow-md transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Curating Videos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Curate Course</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Idea Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">Try searching:</span>
            {sampleTopics.map((sTopic, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTopic(sTopic);
                  handleSearch(sTopic);
                }}
                className="text-[11px] px-2.5 py-1 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                💡 {sTopic}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Video Results Grid */}
      {isSearching ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-rose-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500">
            Searching & analyzing educational YouTube video streams...
          </p>
        </div>
      ) : hasSearched && videos.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Youtube className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No video courses found for "{searchedTopic}"
          </h3>
          <p className="text-xs text-slate-500">Try rephrasing your educational topic query.</p>
        </div>
      ) : videos.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Curated Video Modules ({videos.length}) for "{searchedTopic}"
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((vid, idx) => {
              const videoId = getYoutubeVideoId(vid.link);
              const thumbUrl = videoId
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : null;

              return (
                <div
                  key={idx}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail / Video Banner */}
                  <div className="relative aspect-video bg-slate-800 flex items-center justify-center overflow-hidden">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Youtube className="w-12 h-12 text-rose-500" />
                    )}
                    <a
                      href={vid.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </a>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Video Lesson #{idx + 1}
                      </span>
                      <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-white line-clamp-2 mt-1">
                        {vid.title}
                      </h4>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">YouTube Resource</span>
                      <a
                        href={vid.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        <span>Watch Video</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
