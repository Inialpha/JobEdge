import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { getRequest, postRequest } from '@/utils/apis';

interface JobResult {
  title: string;
  date: string;
  link: string;
  snippet: string;
}

export default function SearchJobs() {
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [daysAgo, setDaysAgo] = useState<number>(2);
  const [maxJobs, setMaxJobs] = useState<number>(50);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [error, setError] = useState<string>('');

  // Load keywords from master resume
  useEffect(() => {
    const loadMasterResume = async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/resumes/`;
        const response = await getRequest(url);
        const masterResume = response.data.find((resume: any) => resume.is_master);
        
        if (masterResume && masterResume.keywords && Array.isArray(masterResume.keywords)) {
          setKeywords(masterResume.keywords);
        }
      } catch (error) {
        console.error('Error loading master resume:', error);
      }
    };

    loadMasterResume();
  }, []);

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

  const handleSearch = async () => {
    if (keywords.length === 0) {
      setError('Please add at least one keyword');
      return;
    }

    setIsSearching(true);
    setError('');

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
      
      setJobs(response.data.jobs || []);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to search jobs. Please try again.');
      console.error('Error searching jobs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = (jobLink: string) => {
    window.open(jobLink, '_blank');
  };

  const handleGenerateResume = async (jobLink: string) => {
    setIsGenerating(jobLink);
    try {
      const url = `${import.meta.env.VITE_API_URL}/resume/generate/`;
      const response = await postRequest(url, { job_link: jobLink });
      
      // Navigate to ResumeBuilder with the generated resume
      navigate('/dashboard/resume-builder', { state: { resume: response.data } });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to generate resume. Please try again.');
      console.error('Error generating resume:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search for Jobs Using your master resume</h1>
      </div>

      {/* Search Form */}
      <Card>
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
                <SelectItem value="">Any</SelectItem>
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
              max="100"
              value={maxJobs}
              onChange={(e) => setMaxJobs(Number(e.target.value))}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button
            className="w-full"
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
      {jobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Search Results ({jobs.length} {jobs.length === 1 ? 'job' : 'jobs'})
          </h2>
          {jobs.map((job, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                {job.date && (
                  <CardDescription>{job.date}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700 line-clamp-3">{job.snippet}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleApply(job.link)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                  <Button
                    onClick={() => handleGenerateResume(job.link)}
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
                        Generate Resume
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
