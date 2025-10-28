import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResumeData, Template, ProfessionalExperience, Education, Project, Certification, Award, PersonalInformation } from '@/types/resume';
import { getEditableResume } from '@/utils/resumeUtils';
import { downloadPDF, downloadDocx } from '@/utils/resumeDownload';
import { ResumePreview } from '@/components/ResumePreview';
import { createRoot, Root } from 'react-dom/client';
import { postRequest } from '@/utils/apis';

export default function ResumeBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const passedResume = location.state?.resume;
  const passedTemplate = location.state?.template || 'classic';
console.log("passedResume", passedResume)
  const rootRef = useRef<Root | null>(null);
  
  const [currentTemplate, setCurrentTemplate] = useState<Template>(passedTemplate);
  const [resume, setResume] = useState<ResumeData>(() => getEditableResume(passedResume));
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  console.log("buildee", resume)

  // Separate states for adding new items
  const [newExperience, setNewExperience] = useState<ProfessionalExperience>({
    organization: '',
    role: '',
    startDate: '',
    endDate: '',
    location: '',
    responsibilities: ['']
  });
  
  const [newEducation, setNewEducation] = useState<Education>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: ''
  });
  
  const [newProject, setNewProject] = useState<Project>({
    name: '',
    description: '',
    technologies: '',
    link: ''
  });
  
  const [newCertification, setNewCertification] = useState<Certification>({
    name: '',
    issuer: '',
    year: ''
  });
  
  const [newAward, setNewAward] = useState<Award>({
    title: '',
    organization: '',
    year: ''
  });

  const updateResume = useCallback((field: keyof ResumeData, value: string | ProfessionalExperience[] | Education[] | Project[] | Certification[] | Award[] | PersonalInformation) => {
    setResume(prev => ({ ...prev, [field]: value }));
  }, []);

  const updatePersonalInfo = useCallback((field: keyof ResumeData['personalInformation'], value: string) => {
    setResume(prev => ({
      ...prev,
      personalInformation: { ...prev.personalInformation, [field]: value }
    }));
  }, []);

  const selectTemplate = useCallback((template: Template, event?: React.MouseEvent) => {
    setCurrentTemplate(template);
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.remove('active');
    });
    if (event?.target) {
      (event.target as HTMLElement).closest('.template-card')?.classList.add('active');
    }
  }, []);

  const addSkill = useCallback((skill: string) => {
    if (skill.trim()) {
      const currentSkills = Array.isArray(resume.skills) ? resume.skills : [];
      updateResume('skills', [...currentSkills, skill.trim()]);
    }
  }, [resume.skills, updateResume]);

  const removeSkill = useCallback((index: number) => {
    const currentSkills = Array.isArray(resume.skills) ? resume.skills : [];
    const updated = currentSkills.filter((_, i) => i !== index);
    updateResume('skills', updated);
  }, [resume.skills, updateResume]);

  const addExperienceItem = useCallback(() => {
    if (newExperience.organization && newExperience.role) {
      updateResume('professionalExperience', [...resume.professionalExperience, newExperience]);
      setNewExperience({
        organization: '',
        role: '',
        startDate: '',
        endDate: '',
        location: '',
        responsibilities: ['']
      });
    }
  }, [newExperience, resume.professionalExperience, updateResume]);

  const updateExperience = useCallback((index: number, field: keyof ProfessionalExperience, value: string | string[]) => {
    const updated = [...resume.professionalExperience];
    updated[index] = { ...updated[index], [field]: value };
    updateResume('professionalExperience', updated);
  }, [resume.professionalExperience, updateResume]);

  const removeExperience = useCallback((index: number) => {
    updateResume('professionalExperience', resume.professionalExperience.filter((_, i) => i !== index));
  }, [resume.professionalExperience, updateResume]);

  const addEducationItem = useCallback(() => {
    if (newEducation.institution && newEducation.degree) {
      updateResume('education', [...resume.education, newEducation]);
      setNewEducation({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: ''
      });
    }
  }, [newEducation, resume.education, updateResume]);

  const updateEducationItem = useCallback((index: number, field: keyof Education, value: string) => {
    const updated = [...resume.education];
    updated[index] = { ...updated[index], [field]: value };
    updateResume('education', updated);
  }, [resume.education, updateResume]);

  const removeEducation = useCallback((index: number) => {
    updateResume('education', resume.education.filter((_, i) => i !== index));
  }, [resume.education, updateResume]);

  const addProjectItem = useCallback(() => {
    if (newProject.name) {
      updateResume('projects', [...resume.projects, newProject]);
      setNewProject({
        name: '',
        description: '',
        technologies: '',
        link: ''
      });
    }
  }, [newProject, resume.projects, updateResume]);

  const updateProjectItem = useCallback((index: number, field: keyof Project, value: string) => {
    const updated = [...resume.projects];
    updated[index] = { ...updated[index], [field]: value };
    updateResume('projects', updated);
  }, [resume.projects, updateResume]);

  const removeProject = useCallback((index: number) => {
    updateResume('projects', resume.projects.filter((_, i) => i !== index));
  }, [resume.projects, updateResume]);

  const addCertificationItem = useCallback(() => {
    if (newCertification.name) {
      updateResume('certifications', [...resume.certifications, newCertification]);
      setNewCertification({
        name: '',
        issuer: '',
        year: ''
      });
    }
  }, [newCertification, resume.certifications, updateResume]);

  const updateCertificationItem = useCallback((index: number, field: keyof Certification, value: string) => {
    const updated = [...resume.certifications];
    updated[index] = { ...updated[index], [field]: value };
    updateResume('certifications', updated);
  }, [resume.certifications, updateResume]);

  const removeCertification = useCallback((index: number) => {
    updateResume('certifications', resume.certifications.filter((_, i) => i !== index));
  }, [resume.certifications, updateResume]);

  const addAwardItem = useCallback(() => {
    if (newAward.title) {
      updateResume('awards', [...resume.awards, newAward]);
      setNewAward({
        title: '',
        organization: '',
        year: ''
      });
    }
  }, [newAward, resume.awards, updateResume]);

  const updateAwardItem = useCallback((index: number, field: keyof Award, value: string) => {
    const updated = [...resume.awards];
    updated[index] = { ...updated[index], [field]: value };
    updateResume('awards', updated);
  }, [resume.awards, updateResume]);

  const removeAward = useCallback((index: number) => {
    updateResume('awards', resume.awards.filter((_, i) => i !== index));
  }, [resume.awards, updateResume]);

  const saveAsMasterResume = useCallback(async () => {
    // Validate required fields
    const errors: {[key: string]: string} = {};
    
    // Validate personal information
    if (!resume.personalInformation.name.trim()) {
      errors['personalInformation.name'] = 'Name is required';
    }
    if (!resume.personalInformation.profession?.trim()) {
      errors['personalInformation.profession'] = 'Profession is required';
    }
    
    // Validate education
    resume.education.forEach((edu, index) => {
      if (!edu.institution.trim()) {
        errors[`education.${index}.institution`] = 'Institution is required';
      }
      if (!edu.degree.trim()) {
        errors[`education.${index}.certificate`] = 'Certificate/Degree is required';
      }
      if (!edu.startDate.trim()) {
        errors[`education.${index}.startDate`] = 'Start date is required';
      }
      if (!edu.endDate.trim()) {
        errors[`education.${index}.endDate`] = 'End date is required';
      }
    });
    
    // Validate professional experience
    resume.professionalExperience.forEach((exp, index) => {
      if (!exp.role.trim()) {
        errors[`professionalExperience.${index}.role`] = 'Role is required';
      }
      if (!exp.organization.trim()) {
        errors[`professionalExperience.${index}.organization`] = 'Organization is required';
      }
      if (!exp.startDate.trim()) {
        errors[`professionalExperience.${index}.startDate`] = 'Start date is required';
      }
      if (!exp.endDate.trim()) {
        errors[`professionalExperience.${index}.endDate`] = 'End date is required';
      }
    });
    
    // Validate projects
    resume.projects.forEach((proj, index) => {
      if (!proj.name.trim()) {
        errors[`projects.${index}.name`] = 'Project name is required';
      }
      if (!proj?.description?.trim()) {
        errors[`projects.${index}.description`] = 'Project description is required';
      }
    });
    
    // If there are validation errors, show them and don't proceed
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSaveMessage({type: 'error', text: 'Please fill in all required fields before saving.'});
      setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
      return;
    }
    
    // Clear validation errors if all is good
    setValidationErrors({});
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/resume/from-object/`;
      const resumeData = {
        ...resume,
        is_master: true
      };
      
      const response = await postRequest(url, resumeData);
      
      if (response.ok) {
        await response.json();
        setSaveMessage({type: 'success', text: 'Resume saved as master resume successfully!'});
        setTimeout(() => {
          navigate('/dashboard', { state: { component: 'resumes' } });
        }, 1500);
      } else {
        const error = await response.json();
        console.error('Error saving resume:', error);
        setSaveMessage({type: 'error', text: 'Failed to save resume. Please try again.'});
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveMessage({type: 'error', text: 'Failed to save resume. Please try again.'});
    } finally {
      setIsSaving(false);
      saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 5000);
    }
  }, [resume, navigate]);

  const updateResponsibility = useCallback((expIndex: number, respIndex: number, value: string) => {
    const updated = [...resume.professionalExperience];
    updated[expIndex].responsibilities[respIndex] = value;
    updateResume('professionalExperience', updated);
  }, [resume.professionalExperience, updateResume]);

  const addResponsibility = useCallback((expIndex: number) => {
    const updated = [...resume.professionalExperience];
    updated[expIndex].responsibilities.push('');
    updateResume('professionalExperience', updated);
  }, [resume.professionalExperience, updateResume]);

  // Update preview when resume or template changes
  useEffect(() => {
    const element = document.getElementById('resumePreview');
    if (!element) return;

    element.className = `resume-preview ${currentTemplate}-template`;
    
    // Create root only once
    if (!rootRef.current) {
      rootRef.current = createRoot(element);
    }
    
    rootRef.current.render(<ResumePreview resume={resume} template={currentTemplate} />);
  }, [resume, currentTemplate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 20px;
        }
        .editor-panel {
          background: white;
          border-radius: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          height: fit-content;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
        }
        .preview-panel {
          background: white;
          border-radius: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          padding: 30px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          text-align: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .header h1 {
          font-size: 22px;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 12px;
          opacity: 0.9;
        }
        .controls {
          padding: 15px 20px;
          background: #f8f9fa;
          border-bottom: 2px solid #e9ecef;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          flex: 1;
          min-width: 120px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-secondary {
          background: #28a745;
          color: white;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .editor {
          padding: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid #667eea;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        input[type="text"], input[type="email"], input[type="tel"], textarea {
          width: 100%;
          padding: 8px;
          margin-bottom: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 13px;
          transition: border-color 0.3s;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #667eea;
        }
        textarea {
          min-height: 60px;
          resize: vertical;
        }
        label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .item {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 10px;
          border-left: 3px solid #667eea;
        }
        .template-carousel {
          position: relative;
          margin-bottom: 20px;
        }
        .carousel-container {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          gap: 15px;
          padding: 10px;
          scrollbar-width: thin;
        }
        .carousel-container::-webkit-scrollbar {
          height: 8px;
        }
        .carousel-container::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 4px;
        }
        .template-card {
          min-width: 280px;
          scroll-snap-align: start;
          border: 3px solid transparent;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.3s;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .template-card.active {
          border-color: #667eea;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }
        .template-card:hover {
          transform: scale(1.02);
        }
        .template-preview {
          font-size: 9px;
          line-height: 1.3;
        }
        .template-name {
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
          color: #667eea;
          font-size: 13px;
        }
        .add-btn, .remove-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.3s;
        }
        .add-btn {
          background: #28a745;
          color: white;
          width: 100%;
        }
        .remove-btn {
          background: #dc3545;
          color: white;
          float: right;
        }
        .add-btn:hover, .remove-btn:hover {
          opacity: 0.8;
        }
        .skill-tag {
          display: inline-block;
         
          border-radius: 15px;
          margin: 3px;
          font-size: 12px;
          position: relative;
        }
        .skill-tag-edit {
          background: #e9ecef;
          border-radius: 15px;
          padding: 5px 10px;
        }
        .skill-tag button {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          margin-left: 5px;
          font-weight: bold;
        }
        .skill-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .skill-input-group input {
          flex: 1;
          margin-bottom: 0;
        }
        
        /* Resume Preview Styles */
        .resume-preview {
          background: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 800px;
        }
        
        /* Classic Template */
        .classic-template .resume-name {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 5px;
          color: #2c3e50;
        }
        .classic-template .resume-title {
          font-size: 18px;
          text-align: center;
          color: #7f8c8d;
          margin-bottom: 10px;
        }
        .classic-template .resume-contact {
          text-align: center;
          font-size: 12px;
          color: #555;
          margin-bottom: 20px;
        }
        .classic-template .resume-section-title {
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 5px;
          margin: 20px 0 10px 0;
          text-transform: uppercase;
        }
        
        /* Modern Template */
        .modern-template {
          display: grid;
          grid-template-columns: 35% 65%;
          gap: 0;
        }
        .modern-template .sidebar {
          background: #2c3e50;
          color: white;
          padding: 30px 20px;
        }
        .modern-template .main-content {
          padding: 30px;
        }
        .modern-template .resume-name {
          font-size: 28px;
          font-weight: bold;
          color: white;
          margin-bottom: 5px;
        }
        .modern-template .resume-title {
          font-size: 14px;
          color: #ecf0f1;
          margin-bottom: 15px;
        }
        .modern-template .resume-contact {
          font-size: 11px;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .modern-template .resume-section-title {
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .modern-template .sidebar .resume-section-title {
          color: #3498db;
          border-bottom: 2px solid #3498db;
          padding-bottom: 5px;
        }
        .modern-template .main-content .resume-section-title {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 5px;
        }
        
        /* Minimal Template */
        .minimal-template .resume-name {
          font-size: 36px;
          font-weight: 300;
          margin-bottom: 5px;
          color: #333;
        }
        .minimal-template .resume-title {
          font-size: 16px;
          font-weight: 300;
          color: #666;
          margin-bottom: 15px;
        }
        .minimal-template .resume-contact {
          font-size: 12px;
          color: #666;
          margin-bottom: 25px;
        }
        .minimal-template .resume-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 20px 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        /* Creative Template */
        .creative-template .resume-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          margin: -40px -40px 20px -40px;
        }
        .creative-template .resume-name {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .creative-template .resume-title {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 10px;
        }
        .creative-template .resume-contact {
          font-size: 12px;
          opacity: 0.9;
        }
        .creative-template .resume-section-title {
          font-size: 16px;
          font-weight: bold;
          color: #667eea;
          margin: 20px 0 10px 0;
          text-transform: uppercase;
          position: relative;
          padding-left: 15px;
        }
        .creative-template .resume-section-title:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Common styles */
        .resume-content {
          font-size: 12px;
          line-height: 1.6;
          color: #333;
        }
        .job-header {
          margin-bottom: 5px;
          clear: both;
        }
        .job-title {
          font-weight: bold;
        }
        .job-duration {
          float: right;
          color: #666;
          font-size: 11px;
        }
        .resume-content ul {
          margin-left: 20px;
          margin-bottom: 10px;
        }
        .resume-content li {
          margin-bottom: 3px;
        }
      `}</style>
      
      <div className="container">
        {/* Editor Panel */}
        <div className="editor-panel">
          <div className="header">
            <h1>Resume Builder</h1>
            <p>Edit & Download as PDF/DOCX</p>
          </div>
          
          <div className="controls">
            {saveMessage && (
              <div style={{
                padding: '10px 15px',
                borderRadius: '6px',
                backgroundColor: saveMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                color: saveMessage.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${saveMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                marginBottom: '10px',
                width: '100%',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {saveMessage.text}
              </div>
            )}
            <button className="btn btn-primary" onClick={() => downloadPDF('resumePreview')}>📄 Download PDF</button>
            <button className="btn btn-secondary" onClick={() => downloadDocx(resume, currentTemplate)}>📥 Download DOCX</button>
            <button 
              className="btn" 
              style={{background: '#17a2b8', color: 'white'}}
              onClick={saveAsMasterResume}
              disabled={isSaving}
            >
              {isSaving ? '💾 Saving...' : '💾 Save as Master Resume'}
            </button>
          </div>

          <div className="editor">
            {/* Template Selection */}
            <div className="section">
              <div className="section-title">Choose Template</div>
              <div className="template-carousel">
                <div className="carousel-container">
                  <div className="template-card active" onClick={(e) => selectTemplate('classic', e)}>
                    <div className="template-name">Classic</div>
                    <div className="template-preview">
                      <div style={{fontWeight: 'bold', textAlign: 'center', fontSize: '11px'}}>JOHN DOE</div>
                      <div style={{textAlign: 'center', fontSize: '8px', color: '#666'}}>Software Engineer</div>
                      <div style={{borderBottom: '1px solid #000', margin: '5px 0'}}></div>
                      <div style={{fontSize: '7px'}}>Professional summary text...</div>
                    </div>
                  </div>
                  <div className="template-card" onClick={(e) => selectTemplate('modern', e)}>
                    <div className="template-name">Modern</div>
                    <div className="template-preview">
                      <div style={{display: 'grid', gridTemplateColumns: '40% 60%', gap: '3px'}}>
                        <div style={{background: '#2c3e50', color: 'white', padding: '5px', fontSize: '7px'}}>
                          <div style={{fontWeight: 'bold'}}>JOHN DOE</div>
                          <div>Skills here</div>
                        </div>
                        <div style={{padding: '5px', fontSize: '7px'}}>
                          <div>Experience</div>
                          <div>Content...</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="template-card" onClick={(e) => selectTemplate('minimal', e)}>
                    <div className="template-name">Minimal</div>
                    <div className="template-preview">
                      <div style={{fontWeight: 300, fontSize: '11px'}}>John Doe</div>
                      <div style={{fontSize: '7px', color: '#666', marginBottom: '5px'}}>Software Engineer</div>
                      <div style={{fontSize: '7px'}}>Clean and simple design with focus on content</div>
                    </div>
                  </div>
                  <div className="template-card" onClick={(e) => selectTemplate('creative', e)}>
                    <div className="template-name">Creative</div>
                    <div className="template-preview">
                      <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '5px', margin: '-5px -5px 5px -5px'}}>
                        <div style={{fontWeight: 'bold', fontSize: '9px'}}>JOHN DOE</div>
                        <div style={{fontSize: '7px'}}>Designer</div>
                      </div>
                      <div style={{fontSize: '7px'}}>Colorful and eye-catching</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="section">
              <div className="section-title">Personal Information</div>
              <input 
                type="text" 
                placeholder="Full Name *" 
                value={resume.personalInformation.name} 
                onChange={(e) => updatePersonalInfo('name', e.target.value)} 
                style={{borderColor: validationErrors['personalInformation.name'] ? '#dc3545' : undefined}}
              />
              {validationErrors['personalInformation.name'] && (
                <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                  {validationErrors['personalInformation.name']}
                </div>
              )}
              <input 
                type="text" 
                placeholder="Profession *" 
                value={resume.personalInformation.profession || ''} 
                onChange={(e) => updatePersonalInfo('profession', e.target.value)} 
                style={{borderColor: validationErrors['personalInformation.profession'] ? '#dc3545' : undefined}}
              />
              {validationErrors['personalInformation.profession'] && (
                <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                  {validationErrors['personalInformation.profession']}
                </div>
              )}
              <input type="email" placeholder="Email" value={resume.personalInformation.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} />
              <input type="tel" placeholder="Phone" value={resume.personalInformation.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} />
              <input type="text" placeholder="Address" value={resume.personalInformation.address} onChange={(e) => updatePersonalInfo('address', e.target.value)} />
              <input type="text" placeholder="LinkedIn" value={resume.personalInformation.linkedin} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} />
              <input type="text" placeholder="Website" value={resume.personalInformation.website} onChange={(e) => updatePersonalInfo('website', e.target.value)} />
            </div>

            {/* Professional Summary */}
            <div className="section">
              <div className="section-title">Professional Summary</div>
              <textarea value={resume.summary} onChange={(e) => updateResume('summary', e.target.value)} />
            </div>

            {/* Skills */}
            <div className="section">
              <div className="section-title">Skills</div>
              <div className="skill-input-group">
                <input 
                  type="text" 
                  placeholder="Add a skill (separated by ,)" 
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSkill((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button className="add-btn" style={{width: 'auto', marginTop: 0}} onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addSkill(input.value);
                  input.value = '';
                }}>+ Add</button>
              </div>
              <div>
                {(Array.isArray(resume.skills) ? resume.skills : []).map((skill: string, index: number) => (
                  <span key={index} className="skill-tag skill-tag-edit">
                    {skill}
                    <button onClick={() => removeSkill(index)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="section">
              <div className="section-title">Professional Experience</div>
              {resume.professionalExperience.map((exp, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Role *" 
                    value={exp.role}
                    onChange={(e) => updateExperience(index, 'role', e.target.value)}
                    style={{borderColor: validationErrors[`professionalExperience.${index}.role`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`professionalExperience.${index}.role`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`professionalExperience.${index}.role`]}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="Organization *" 
                    value={exp.organization}
                    onChange={(e) => updateExperience(index, 'organization', e.target.value)}
                    style={{borderColor: validationErrors[`professionalExperience.${index}.organization`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`professionalExperience.${index}.organization`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`professionalExperience.${index}.organization`]}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="Location" 
                    value={exp.location}
                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Start Date (e.g., Jun 2020) *" 
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    style={{borderColor: validationErrors[`professionalExperience.${index}.startDate`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`professionalExperience.${index}.startDate`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`professionalExperience.${index}.startDate`]}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="End Date (e.g., Present) *" 
                    value={exp.endDate}
                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    style={{borderColor: validationErrors[`professionalExperience.${index}.endDate`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`professionalExperience.${index}.endDate`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`professionalExperience.${index}.endDate`]}
                    </div>
                  )}
                  {exp.responsibilities.map((resp, respIndex) => (
                    <input 
                      key={respIndex}
                      type="text" 
                      placeholder={`Responsibility ${respIndex + 1}`}
                      value={resp}
                      onChange={(e) => updateResponsibility(index, respIndex, e.target.value)}
                    />
                  ))}
                  <button className="add-btn" onClick={() => addResponsibility(index)}>+ Add Responsibility</button>
                  <button className="remove-btn" onClick={() => removeExperience(index)}>Remove</button>
                </div>
              ))}
              
              {/* Form for new experience */}
              <div className="item" style={{background: '#e8f4f8'}}>
                <label>Add New Experience</label>
                <input 
                  type="text" 
                  placeholder="Role" 
                  value={newExperience.role}
                  onChange={(e) => setNewExperience({...newExperience, role: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Organization" 
                  value={newExperience.organization}
                  onChange={(e) => setNewExperience({...newExperience, organization: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Location" 
                  value={newExperience.location}
                  onChange={(e) => setNewExperience({...newExperience, location: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Start Date (e.g., Jun 2020)" 
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="End Date (e.g., Present)" 
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})}
                />
                {newExperience.responsibilities.map((resp, respIndex) => (
                  <input 
                    key={respIndex}
                    type="text" 
                    placeholder={`Responsibility ${respIndex + 1}`}
                    value={resp}
                    onChange={(e) => {
                      const updated = [...newExperience.responsibilities];
                      updated[respIndex] = e.target.value;
                      setNewExperience({...newExperience, responsibilities: updated});
                    }}
                  />
                ))}
                <button className="add-btn" onClick={() => setNewExperience({...newExperience, responsibilities: [...newExperience.responsibilities, '']})}>+ Add Responsibility</button>
                <button className="add-btn" onClick={addExperienceItem}>Add Experience</button>
              </div>
            </div>

            {/* Education */}
            <div className="section">
              <div className="section-title">Education</div>
              {resume.education.map((edu, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Certificate/Degree (e.g., Bachelor of Science in Computer Science) *" 
                    value={edu.degree}
                    onChange={(e) => updateEducationItem(index, 'degree', e.target.value)}
                    style={{borderColor: validationErrors[`education.${index}.certificate`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`education.${index}.certificate`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`education.${index}.certificate`]}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="Institution *" 
                    value={edu.institution}
                    onChange={(e) => updateEducationItem(index, 'institution', e.target.value)}
                    style={{borderColor: validationErrors[`education.${index}.institution`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`education.${index}.institution`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`education.${index}.institution`]}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="Field of Study" 
                    value={edu.field}
                    onChange={(e) => updateEducationItem(index, 'field', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Start Date (e.g., 2011) *" 
                    value={edu.startDate}
                    onChange={(e) => updateEducationItem(index, 'startDate', e.target.value)}
                    style={{borderColor: validationErrors[`education.${index}.startDate`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`education.${index}.startDate`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`education.${index}.startDate`]}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="End Date (e.g., 2015) *" 
                    value={edu.endDate}
                    onChange={(e) => updateEducationItem(index, 'endDate', e.target.value)}
                    style={{borderColor: validationErrors[`education.${index}.endDate`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`education.${index}.endDate`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`education.${index}.endDate`]}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="GPA (optional)" 
                    value={edu.gpa}
                    onChange={(e) => updateEducationItem(index, 'gpa', e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeEducation(index)}>Remove</button>
                </div>
              ))}
              
              {/* Form for new education */}
              <div className="item" style={{background: '#e8f4f8'}}>
                <label>Add New Education</label>
                <input 
                  type="text" 
                  placeholder="Degree" 
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Institution" 
                  value={newEducation.institution}
                  onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Field of Study" 
                  value={newEducation.field}
                  onChange={(e) => setNewEducation({...newEducation, field: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Start Date (e.g., 2011)" 
                  value={newEducation.startDate}
                  onChange={(e) => setNewEducation({...newEducation, startDate: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="End Date (e.g., 2015)" 
                  value={newEducation.endDate}
                  onChange={(e) => setNewEducation({...newEducation, endDate: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="GPA (optional)" 
                  value={newEducation.gpa}
                  onChange={(e) => setNewEducation({...newEducation, gpa: e.target.value})}
                />
                <button className="add-btn" onClick={addEducationItem}>Add Education</button>
              </div>
            </div>

            {/* Certifications */}
            <div className="section">
              <div className="section-title">Certifications</div>
              {resume.certifications.map((cert, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Certification Name" 
                    value={cert.name}
                    onChange={(e) => updateCertificationItem(index, 'name', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Issuing Organization" 
                    value={cert.issuer}
                    onChange={(e) => updateCertificationItem(index, 'issuer', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Year" 
                    value={cert.year}
                    onChange={(e) => updateCertificationItem(index, 'year', e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeCertification(index)}>Remove</button>
                </div>
              ))}
              
              {/* Form for new certification */}
              <div className="item" style={{background: '#e8f4f8'}}>
                <label>Add New Certification</label>
                <input 
                  type="text" 
                  placeholder="Certification Name" 
                  value={newCertification.name}
                  onChange={(e) => setNewCertification({...newCertification, name: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Issuing Organization" 
                  value={newCertification.issuer}
                  onChange={(e) => setNewCertification({...newCertification, issuer: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Year" 
                  value={newCertification.year}
                  onChange={(e) => setNewCertification({...newCertification, year: e.target.value})}
                />
                <button className="add-btn" onClick={addCertificationItem}>Add Certification</button>
              </div>
            </div>

            {/* Projects */}
            <div className="section">
              <div className="section-title">Projects</div>
              {resume.projects.map((proj, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Project Name *" 
                    value={proj.name}
                    onChange={(e) => updateProjectItem(index, 'name', e.target.value)}
                    style={{borderColor: validationErrors[`projects.${index}.name`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`projects.${index}.name`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`projects.${index}.name`]}
                    </div>
                  )}
                  <textarea 
                    placeholder="Project Description *" 
                    value={proj.description}
                    onChange={(e) => updateProjectItem(index, 'description', e.target.value)}
                    style={{borderColor: validationErrors[`projects.${index}.description`] ? '#dc3545' : undefined}}
                  />
                  {validationErrors[`projects.${index}.description`] && (
                    <div style={{color: '#dc3545', fontSize: '11px', marginTop: '2px', marginBottom: '8px'}}>
                      {validationErrors[`projects.${index}.description`]}
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="Technologies Used" 
                    value={proj.technologies}
                    onChange={(e) => updateProjectItem(index, 'technologies', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Project Link (optional)" 
                    value={proj.link}
                    onChange={(e) => updateProjectItem(index, 'link', e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeProject(index)}>Remove</button>
                </div>
              ))}
              
              {/* Form for new project */}
              <div className="item" style={{background: '#e8f4f8'}}>
                <label>Add New Project</label>
                <input 
                  type="text" 
                  placeholder="Project Name" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                />
                <textarea 
                  placeholder="Project Description" 
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Technologies Used" 
                  value={newProject.technologies}
                  onChange={(e) => setNewProject({...newProject, technologies: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Project Link (optional)" 
                  value={newProject.link}
                  onChange={(e) => setNewProject({...newProject, link: e.target.value})}
                />
                <button className="add-btn" onClick={addProjectItem}>Add Project</button>
              </div>
            </div>

            {/* Awards */}
            <div className="section">
              <div className="section-title">Awards</div>
              {resume.awards.map((award, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Award Title" 
                    value={award.title}
                    onChange={(e) => updateAwardItem(index, 'title', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Issuing Organization" 
                    value={award.organization}
                    onChange={(e) => updateAwardItem(index, 'organization', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Year" 
                    value={award.year}
                    onChange={(e) => updateAwardItem(index, 'year', e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeAward(index)}>Remove</button>
                </div>
              ))}
              
              {/* Form for new award */}
              <div className="item" style={{background: '#e8f4f8'}}>
                <label>Add New Award</label>
                <input 
                  type="text" 
                  placeholder="Award Title" 
                  value={newAward.title}
                  onChange={(e) => setNewAward({...newAward, title: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Issuing Organization" 
                  value={newAward.organization}
                  onChange={(e) => setNewAward({...newAward, organization: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Year" 
                  value={newAward.year}
                  onChange={(e) => setNewAward({...newAward, year: e.target.value})}
                />
                <button className="add-btn" onClick={addAwardItem}>Add Award</button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <div id="resumePreview" className="resume-preview classic-template"></div>
        </div>
      </div>
    </>
  );
}
