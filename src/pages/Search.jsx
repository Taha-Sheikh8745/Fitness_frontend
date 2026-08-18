import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Dumbbell, Apple, TrendingUp, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Search = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();
    
    const [results, setResults] = useState({ workouts: [], nutrition: [], progress: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (query) {
            fetchResults();
        } else {
            setResults({ workouts: [], nutrition: [], progress: [] });
        }
    }, [query]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
            if (data.success) {
                setResults(data.data);
            }
        } catch (err) {
            setError('Search failed. Please try again.');
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const isEmpty = !results.workouts.length && !results.nutrition.length && !results.progress.length;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black text-white mb-2 flex items-center justify-center gap-4">
                    <SearchIcon className="w-10 h-10 text-accent" /> Global Search
                </h1>
                <p className="text-gray-400">Results for: <span className="text-accent font-bold">"{query}"</span></p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-gray-400 animate-pulse font-bold tracking-widest uppercase text-xs">Scanning database...</p>
                </div>
            ) : error ? (
                <div className="glass-card p-10 text-center flex flex-col items-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button onClick={fetchResults} className="btn-primary px-8">Try Again</button>
                </div>
            ) : isEmpty ? (
                <div className="glass-card p-20 text-center flex flex-col items-center border-dashed border-2 border-white/5">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <SearchIcon className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                    <p className="text-gray-400 max-w-md">We couldn't find anything matching your search. Try different keywords or check for spelling errors.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Workouts Section */}
                    {results.workouts.length > 0 && (
                        <section className="animate-in fade-in duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-accent/10 rounded-lg">
                                    <Dumbbell className="w-6 h-6 text-accent" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Workouts <span className="text-xs ml-2 text-gray-500">({results.workouts.length})</span></h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {results.workouts.map((workout) => (
                                    <Link key={workout._id} to={`/workouts?search=${encodeURIComponent(workout.exercises[0]?.name || '')}`} className="group relative">
                                        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 h-full flex flex-col justify-between border-white/5 hover:border-accent/30 transition-all overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-colors"></div>
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-accent text-slate-900 px-2.5 py-1 rounded">Workout</span>
                                                    <span className="text-[10px] text-gray-500 font-bold">{new Date(workout.date).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">{workout.muscleGroup || workout.category}</h3>
                                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                                    {workout.exercises.map(ex => ex.name).join(', ')}
                                                </p>
                                            </div>
                                            <div className="flex items-center text-accent text-xs font-bold uppercase tracking-widest gap-2">
                                                View Details <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Nutrition Section */}
                    {results.nutrition.length > 0 && (
                        <section className="animate-in fade-in duration-500 delay-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Apple className="w-6 h-6 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Nutrition <span className="text-xs ml-2 text-gray-500">({results.nutrition.length})</span></h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {results.nutrition.map((item) => (
                                    <Link key={item._id} to={`/nutrition?search=${encodeURIComponent(item.foodName)}`} className="group">
                                        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 h-full flex flex-col justify-between border-white/5 hover:border-green-500/30 transition-all relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/10 transition-colors"></div>
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-green-500 text-slate-900 px-2.5 py-1 rounded">{item.mealType}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold">{new Date(item.date).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-500 transition-colors">{item.foodName}</h3>
                                                <div className="flex gap-4 text-xs font-bold text-gray-400">
                                                    <span>{item.calories} kcal</span>
                                                    <span>{item.protein}g Protein</span>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex items-center text-green-500 text-xs font-bold uppercase tracking-widest gap-2">
                                                View Details <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Progress Section */}
                    {results.progress.length > 0 && (
                        <section className="animate-in fade-in duration-500 delay-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-purple-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Progress <span className="text-xs ml-2 text-gray-500">({results.progress.length})</span></h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {results.progress.map((log) => (
                                    <Link key={log._id} to="/progress" className="group">
                                        <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 h-full flex flex-col justify-between border-white/5 hover:border-purple-500/30 transition-all relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors"></div>
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-purple-500 text-slate-900 px-2.5 py-1 rounded">Stats</span>
                                                    <span className="text-[10px] text-gray-500 font-bold">{new Date(log.date).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-500 transition-colors">{log.weight} kg Recorded</h3>
                                                <p className="text-sm text-gray-400 line-clamp-3 italic">"{log.notes || 'No notes added'}"</p>
                                            </div>
                                            <div className="mt-6 flex items-center text-purple-500 text-xs font-bold uppercase tracking-widest gap-2">
                                                View Timeline <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;
