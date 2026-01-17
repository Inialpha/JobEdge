import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { getRequest, postRequest } from '@/utils/apis';
import { useQuery } from '@tanstack/react-query';
import { useView } from '@/context/ViewContext';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { searchJobsTourSteps, tourStyles, tourLocale } from '@/utils/tourConfig';
import { usePageTour } from '@/hooks/usePageTour';


interface JobResult {
  title: string;
  date: string;
  link: string;
  snippet: string;
}

interface Resume {
  id: string;
  keywords: string[];
  is_master: boolean;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  has_master_resume: boolean;
  current_job_search: JobResult[];
  resume: Resume | null;
}

export default function SearchJobs() {
  const navigate = useNavigate();
  const { setCurrentView } = useView();
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [daysAgo, setDaysAgo] = useState<number>(2);
  const [maxJobs, setMaxJobs] = useState<number>(25);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [error, setError] = useState<string>('');

  // Tour state using the new hook
  const { run: runTour, stepIndex: tourStepIndex, setStepIndex: setTourStepIndex, startTour, stopTour, tourCompleted } = usePageTour('search_jobs');

  // Set current view when component mounts
  useEffect(() => {
    setCurrentView("jobs");
  }, [setCurrentView]);
  
  const fetchUser = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/users/profile/`;
      const response = await getRequest(url);      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('Failed to fetch user profile');
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  const { data: userData, isLoading } = useQuery<User>({
    queryKey: ['userProfile'],
    queryFn: fetchUser,
  })

  // Start tour if not completed yet
  useEffect(() => {
    if (!tourCompleted && userData) {
      startTour();
    }
  }, [tourCompleted, startTour, userData]);

  useEffect(() => {
    if (userData?.resume) {
      setKeywords(userData.resume.keywords || [])
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.current_job_search) {
      setJobs(userData.current_job_search);
    }
  }, [userData]);

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  // Handle tour callback
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    } else if (type === EVENTS.STEP_AFTER) {
      setTourStepIndex(index + 1);
    }
  };

  const handleSearch = async () => {
    if (keywords.length === 0) {
      setError('Please add at least one keyword');
      return;
    }

    setIsSearching(true);
    setError('');
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      keywords.forEach(keyword => params.append('keywords', keyword));
      
      if (location) params.append('location', location);
      if (jobType) params.append('job_type', jobType);
      params.append('is_remote', String(isRemote));
      params.append('days_ago', String(daysAgo));
      params.append('max_jobs', String(maxJobs));

      const url = `${import.meta.env.VITE_API_URL}/jobs/search-jobs/?${params.toString()}`;
      const response = await getRequest(url);
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to search jobs. Please try again.');
      }
    } catch (error: any) {
      setError('Failed to search jobs. Please try again.');
      console.error('Error searching jobs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = (jobLink: string) => {
    window.open(jobLink, '_blank', 'noopener,noreferrer');
  };

  async function getDescription(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let description: string | null = null;

    const jsonLdTag = doc.querySelector('script[type="application/ld+json"]');
    if (jsonLdTag?.textContent) {
      try {
        const jobData = JSON.parse(jsonLdTag.textContent);
        if (jobData.description) {
          description = jobData.description;
        }
      } catch (e) {
          console.warn('JSON-LD parse error:', e);
        }
      }
      if (!description) {
        const metaDesc = doc.querySelector('meta[property="og:description"]');
        if (metaDesc && metaDesc.getAttribute('content')) {
          description = metaDesc.getAttribute('content');
      }
    }

    if (!description && doc.body) {
      description = doc.body.innerText.replace(/\s+/g, ' ').trim();
    }

    return description;
  }


  const handleGenerateApplication = async (jobLink: string) => {
    setIsGenerating(jobLink);
    try {
      const jobDescription = await getDescription(jobLink)
      const url = `${import.meta.env.VITE_API_URL}/applications/`;
      const response = await postRequest(url, { 
        job_description: jobDescription, 
        job_link: jobLink 
      }, true);
      
      if (response.ok) {
        await response.json();
        // Navigate to Applications page
        navigate('/dashboard/applications');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate application. Please try again.');
      }
    } catch (error: any) {
      setError('Failed to generate application. Please try again.');
      console.error('Error generating application:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto md:p-6">
      {/* Joyride Tour */}
      <Joyride
        steps={searchJobsTourSteps}
        run={runTour}
        stepIndex={tourStepIndex}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        styles={tourStyles}
        locale={tourLocale}
      />

      {/* Show loader when user data is loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      )}
      
      {!isLoading && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Search for Jobs Using your master resume</h1>
          </div>

          {/* Search Form */}
          <Card className="bg-white rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <CardHeader>
              <CardTitle>Job Search Criteria</CardTitle>
              <CardDescription>
                Customize your job search with keywords from your resume and additional filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords *</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                placeholder="Add a keyword and press Enter"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addKeyword}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeKeyword(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., New York, USA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger id="jobType">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Remote */}
          <div className="flex items-center space-x-2">
            <Switch
              id="remote"
              checked={isRemote}
              onCheckedChange={setIsRemote}
            />
            <Label htmlFor="remote" className="cursor-pointer">
              Remote jobs only
            </Label>
          </div>

          {/* Days Ago */}
          <div className="space-y-2">
            <Label htmlFor="daysAgo">Posted within (days)</Label>
            <Input
              id="daysAgo"
              type="number"
              min="1"
              max="100"
              value={daysAgo}
              onChange={(e) => setDaysAgo(Number(e.target.value))}
            />
          </div>

          {/* Max Jobs */}
          <div className="space-y-2">
            <Label htmlFor="maxJobs">Maximum number of jobs</Label>
            <Input
              id="maxJobs"
              type="number"
              min="1"
              max="25"
              value={maxJobs}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                // Enforce maximum of 25 jobs, handle NaN
                if (isNaN(value) || value < 1) {
                  setMaxJobs(1);
                } else if (value > 25) {
                  setMaxJobs(25);
                } else {
                  setMaxJobs(value);
                }
              }}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 search-button"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Jobs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Job Results */}
      {hasSearched && jobs.length === 0 && !isSearching && (
        <div className="mt-6">
          <Card className="bg-white rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-l-4 border-l-yellow-500">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full mb-4">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">No Jobs Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  We couldn't find any jobs matching your search criteria. Try adjusting your filters to see more results.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mt-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">💡 Suggestions:</p>
                  <ul className="text-sm text-blue-700 text-left space-y-1">
                    <li>• Consider increasing the number of days in the "Posted within" filter (currently set to {daysAgo} {daysAgo === 1 ? 'day' : 'days'})</li>
                    <li>• Try removing location or job type filters</li>
                    <li>• Use more general keywords</li>
                    <li>• Try disabling the "Remote jobs only" filter if enabled</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {jobs.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Search Results ({jobs.length} {jobs.length === 1 ? 'job' : 'jobs'})
          </h2>
          {jobs.map((job, index) => (
            <Card key={index} className="bg-white rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_70px_rgba(102,126,234,0.4)] transition-all duration-300 border-l-4 border-l-purple-600">
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{job.title}</CardTitle>
                {job.date && (
                  <CardDescription className="text-gray-600 font-medium">{job.date}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{job.snippet}</p>
                <div className="flex gap-2">
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    onClick={() => handleApply(job.link)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    onClick={() => handleGenerateApplication(job.link)}
                    disabled={isGenerating === job.link}
                  >
                    {isGenerating === job.link ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Application
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
