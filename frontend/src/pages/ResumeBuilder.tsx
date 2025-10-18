import { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// Types
type Skill = string;

type Experience = {
  title: string;
  duration: string;
  responsibilities: string[];
};

type Certification = {
  name: string;
  issuer: string;
  year: string;
};

type Project = {
  name: string;
  description: string;
  technologies: string;
};

type Award = {
  title: string;
  organization: string;
  year: string;
};

type Template = 'classic' | 'modern' | 'minimal' | 'creative';

export default function ResumeBuilder() {
  const [currentTemplate, setCurrentTemplate] = useState<Template>('classic');
  const [skills, setSkills] = useState<Skill[]>([
    'Python', 'R', 'SQL', 'TensorFlow', 'PyTorch', 'Machine Learning', 
    'Deep Learning', 'NLP', 'Data Analysis', 'AWS', 'Docker'
  ]);
  const [newSkill, setNewSkill] = useState('');
  
  const [name, setName] = useState('VIKAS GUPTA');
  const [jobTitle, setJobTitle] = useState('Senior Machine Learning Engineer');
  const [location, setLocation] = useState('New York, NY');
  const [phone, setPhone] = useState('(123) 456-7800');
  const [email, setEmail] = useState('Vikas@techvikasika.com');
  const [summary, setSummary] = useState('Results-driven Data Scientist with 5+ years of experience solving business challenges using machine learning, statistical analysis, and data-driven strategies. Skilled in building predictive models, recommendation systems, and NLP tools.');
  
  const [degree, setDegree] = useState('Bachelor of Technology (Computer Science)');
  const [institution, setInstitution] = useState('Indian Institute of Technology (IIT)');
  const [eduYear, setEduYear] = useState('2011-2015');
  
  const [experiences, setExperiences] = useState<Experience[]>([
    {
      title: 'Data Scientist | AppItron Solutions, New York, NY',
      duration: 'Jun 2020 - Present',
      responsibilities: [
        'Built a customer churn prediction model (XGBoost) with 85% accuracy, improving retention by 28%',
        'Created a real-time Tableau dashboard to track marketing campaigns, cutting decision time by 40%',
        'Led a team of 3 data analysts in A/B testing for product features, boosting user engagement by 15%'
      ]
    },
    {
      title: 'Machine Learning Engineer | TechNova Inc, San Francisco, CA',
      duration: 'Jan 2018 - May 2020',
      responsibilities: [
        'Developed recommendation engine using collaborative filtering, increasing sales by 20%',
        'Implemented sentiment analysis tool for customer feedback using BERT',
        'Optimized ML pipelines reducing model training time by 50%'
      ]
    }
  ]);
  
  const [certifications, setCertifications] = useState<Certification[]>([
    {
      name: 'AWS Certified Machine Learning - Specialty',
      issuer: 'Amazon Web Services',
      year: '2021'
    },
    {
      name: 'Deep Learning Specialization',
      issuer: 'Coursera (Andrew Ng)',
      year: '2019'
    }
  ]);
  
  const [projects, setProjects] = useState<Project[]>([
    {
      name: 'Customer Segmentation Analysis',
      description: 'Developed K-means clustering model to segment 100K+ customers, enabling targeted marketing campaigns',
      technologies: 'Python, Scikit-learn, Pandas'
    },
    {
      name: 'Fraud Detection System',
      description: 'Built real-time fraud detection using Random Forest achieving 92% accuracy',
      technologies: 'Python, TensorFlow, AWS Lambda'
    }
  ]);
  
  const [awards, setAwards] = useState<Award[]>([
    {
      title: 'Best Innovation Award',
      organization: 'AppItron Solutions',
      year: '2022'
    },
    {
      title: 'Data Science Excellence',
      organization: 'TechNova Inc',
      year: '2019'
    }
  ]);

  const selectTemplate = (template: Template, event?: React.MouseEvent) => {
    setCurrentTemplate(template);
    document.querySelectorAll('.template-card').forEach(card => {
      card.classList.remove('active');
    });
    event?.target && (event.target as HTMLElement).closest('.template-card')?.classList.add('active');
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      title: '',
      duration: '',
      responsibilities: ['']
    }]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | string[]) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const addResponsibility = (expIndex: number) => {
    const updated = [...experiences];
    updated[expIndex].responsibilities.push('');
    setExperiences(updated);
  };

  const updateResponsibility = (expIndex: number, respIndex: number, value: string) => {
    const updated = [...experiences];
    updated[expIndex].responsibilities[respIndex] = value;
    setExperiences(updated);
  };

  const addCertification = () => {
    setCertifications([...certifications, { name: '', issuer: '', year: '' }]);
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const addProject = () => {
    setProjects([...projects, { name: '', description: '', technologies: '' }]);
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const addAward = () => {
    setAwards([...awards, { title: '', organization: '', year: '' }]);
  };

  const updateAward = (index: number, field: keyof Award, value: string) => {
    const updated = [...awards];
    updated[index] = { ...updated[index], [field]: value };
    setAwards(updated);
  };

  const removeAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  useEffect(() => {
    updatePreview();
  }, [currentTemplate, name, jobTitle, location, phone, email, summary, skills, experiences, degree, institution, eduYear, certifications, projects, awards]);

  // Simple HTML escaping to prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const updatePreview = () => {
    const preview = document.getElementById('resumePreview');
    if (!preview) return;

    preview.className = `resume-preview ${currentTemplate}-template`;
    
    if (currentTemplate === 'modern') {
      preview.innerHTML = `
        <div class="sidebar">
          <div class="resume-name">${escapeHtml(name)}</div>
          <div class="resume-title">${escapeHtml(jobTitle)}</div>
          <div class="resume-contact">
            ${escapeHtml(location)}<br>
            ${escapeHtml(phone)}<br>
            ${escapeHtml(email)}
          </div>
          ${skills.length > 0 ? `
            <div class="resume-section-title">Skills</div>
            <div class="resume-content">
              ${skills.map(skill => `<div class="skill-tag">${escapeHtml(skill)}</div>`).join('')}
            </div>
          ` : ''}
          ${degree ? `
            <div class="resume-section-title">Education</div>
            <div class="resume-content">
              <div><strong>${escapeHtml(degree)}</strong></div>
              <div>${escapeHtml(institution)}</div>
              <div>${escapeHtml(eduYear)}</div>
            </div>
          ` : ''}
        </div>
        <div class="main-content">
          ${summary ? `
            <div class="resume-section-title">Professional Summary</div>
            <div class="resume-content">${escapeHtml(summary)}</div>
          ` : ''}
          ${experiences.length > 0 ? `
            <div class="resume-section-title">Experience</div>
            <div class="resume-content">
              ${experiences.map(exp => `
                <div class="job-header">
                  <span class="job-title">${escapeHtml(exp.title)}</span>
                  <span class="job-duration">${escapeHtml(exp.duration)}</span>
                </div>
                <ul>
                  ${exp.responsibilities.map(resp => `<li>${escapeHtml(resp)}</li>`).join('')}
                </ul>
              `).join('')}
            </div>
          ` : ''}
          ${certifications.length > 0 ? `
            <div class="resume-section-title">Certifications</div>
            <div class="resume-content">
              ${certifications.map(cert => `
                <div><strong>${escapeHtml(cert.name)}</strong></div>
                <div>${escapeHtml(cert.issuer)} - ${escapeHtml(cert.year)}</div>
              `).join('<br>')}
            </div>
          ` : ''}
          ${projects.length > 0 ? `
            <div class="resume-section-title">Projects</div>
            <div class="resume-content">
              ${projects.map(proj => `
                <div><strong>${escapeHtml(proj.name)}</strong></div>
                <div>${escapeHtml(proj.description)}</div>
                <div><em>${escapeHtml(proj.technologies)}</em></div>
              `).join('<br>')}
            </div>
          ` : ''}
          ${awards.length > 0 ? `
            <div class="resume-section-title">Awards</div>
            <div class="resume-content">
              ${awards.map(award => `
                <div><strong>${escapeHtml(award.title)}</strong> - ${escapeHtml(award.organization)} (${escapeHtml(award.year)})</div>
              `).join('<br>')}
            </div>
          ` : ''}
        </div>
      `;
    } else if (currentTemplate === 'creative') {
      preview.innerHTML = `
        <div class="resume-header">
          <div class="resume-name">${escapeHtml(name)}</div>
          <div class="resume-title">${escapeHtml(jobTitle)}</div>
          <div class="resume-contact">${escapeHtml(location)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div>
        </div>
        ${summary ? `
          <div class="resume-section-title">Professional Summary</div>
          <div class="resume-content">${escapeHtml(summary)}</div>
        ` : ''}
        ${experiences.length > 0 ? `
          <div class="resume-section-title">Experience</div>
          <div class="resume-content">
            ${experiences.map(exp => `
              <div class="job-header">
                <span class="job-title">${escapeHtml(exp.title)}</span>
                <span class="job-duration">${escapeHtml(exp.duration)}</span>
              </div>
              <ul>
                ${exp.responsibilities.map(resp => `<li>${escapeHtml(resp)}</li>`).join('')}
              </ul>
            `).join('')}
          </div>
        ` : ''}
        ${degree ? `
          <div class="resume-section-title">Education</div>
          <div class="resume-content">
            <div><strong>${escapeHtml(degree)}</strong></div>
            <div>${escapeHtml(institution)}</div>
            <div>${escapeHtml(eduYear)}</div>
          </div>
        ` : ''}
        ${skills.length > 0 ? `
          <div class="resume-section-title">Skills</div>
          <div class="resume-content">
            ${skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join(' ')}
          </div>
        ` : ''}
        ${certifications.length > 0 ? `
          <div class="resume-section-title">Certifications</div>
          <div class="resume-content">
            ${certifications.map(cert => `
              <div><strong>${escapeHtml(cert.name)}</strong></div>
              <div>${escapeHtml(cert.issuer)} - ${escapeHtml(cert.year)}</div>
            `).join('<br>')}
          </div>
        ` : ''}
        ${projects.length > 0 ? `
          <div class="resume-section-title">Projects</div>
          <div class="resume-content">
            ${projects.map(proj => `
              <div><strong>${escapeHtml(proj.name)}</strong></div>
              <div>${escapeHtml(proj.description)}</div>
              <div><em>${escapeHtml(proj.technologies)}</em></div>
            `).join('<br>')}
          </div>
        ` : ''}
        ${awards.length > 0 ? `
          <div class="resume-section-title">Awards</div>
          <div class="resume-content">
            ${awards.map(award => `
              <div><strong>${escapeHtml(award.title)}</strong> - ${escapeHtml(award.organization)} (${escapeHtml(award.year)})</div>
            `).join('<br>')}
          </div>
        ` : ''}
      `;
    } else {
      // Classic and Minimal templates
      preview.innerHTML = `
        <div class="resume-name">${escapeHtml(name)}</div>
        <div class="resume-title">${escapeHtml(jobTitle)}</div>
        <div class="resume-contact">${escapeHtml(location)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div>
        ${summary ? `
          <div class="resume-section-title">Professional Summary</div>
          <div class="resume-content">${escapeHtml(summary)}</div>
        ` : ''}
        ${experiences.length > 0 ? `
          <div class="resume-section-title">Professional Experience</div>
          <div class="resume-content">
            ${experiences.map(exp => `
              <div class="job-header">
                <span class="job-title">${escapeHtml(exp.title)}</span>
                <span class="job-duration">${escapeHtml(exp.duration)}</span>
              </div>
              <ul>
                ${exp.responsibilities.map(resp => `<li>${escapeHtml(resp)}</li>`).join('')}
              </ul>
            `).join('')}
          </div>
        ` : ''}
        ${degree ? `
          <div class="resume-section-title">Education</div>
          <div class="resume-content">
            <div><strong>${escapeHtml(degree)}</strong></div>
            <div>${escapeHtml(institution)}</div>
            <div>${escapeHtml(eduYear)}</div>
          </div>
        ` : ''}
        ${skills.length > 0 ? `
          <div class="resume-section-title">Skills</div>
          <div class="resume-content">
            ${skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join(' ')}
          </div>
        ` : ''}
        ${certifications.length > 0 ? `
          <div class="resume-section-title">Certifications</div>
          <div class="resume-content">
            ${certifications.map(cert => `
              <div><strong>${escapeHtml(cert.name)}</strong></div>
              <div>${escapeHtml(cert.issuer)} - ${escapeHtml(cert.year)}</div>
            `).join('<br>')}
          </div>
        ` : ''}
        ${projects.length > 0 ? `
          <div class="resume-section-title">Projects</div>
          <div class="resume-content">
            ${projects.map(proj => `
              <div><strong>${escapeHtml(proj.name)}</strong></div>
              <div>${escapeHtml(proj.description)}</div>
              <div><em>${escapeHtml(proj.technologies)}</em></div>
            `).join('<br>')}
          </div>
        ` : ''}
        ${awards.length > 0 ? `
          <div class="resume-section-title">Awards</div>
          <div class="resume-content">
            ${awards.map(award => `
              <div><strong>${escapeHtml(award.title)}</strong> - ${escapeHtml(award.organization)} (${escapeHtml(award.year)})</div>
            `).join('<br>')}
          </div>
        ` : ''}
      `;
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('resumePreview');
    if (!element) return;

    // Using html2pdf library (needs to be loaded via CDN)
    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
      const opt = {
        margin: 0.5,
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } else {
      console.error('PDF library not loaded. Please ensure html2pdf.js is included.');
    }
  };

  const downloadDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: name,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: jobTitle,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${location} | ${phone} | ${email}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),
          ...(summary ? [
            new Paragraph({
              text: 'Professional Summary',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: summary }),
            new Paragraph({ text: '' }),
          ] : []),
          ...(experiences.length > 0 ? [
            new Paragraph({
              text: 'Professional Experience',
              heading: HeadingLevel.HEADING_2,
            }),
            ...experiences.flatMap(exp => [
              new Paragraph({
                children: [
                  new TextRun({ text: exp.title, bold: true }),
                  new TextRun({ text: ` (${exp.duration})` }),
                ],
              }),
              ...exp.responsibilities.map(resp => new Paragraph({
                text: `• ${resp}`,
                bullet: { level: 0 },
              })),
              new Paragraph({ text: '' }),
            ]),
          ] : []),
          ...(degree ? [
            new Paragraph({
              text: 'Education',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [new TextRun({ text: degree, bold: true })],
            }),
            new Paragraph({ text: institution }),
            new Paragraph({ text: eduYear }),
            new Paragraph({ text: '' }),
          ] : []),
          ...(skills.length > 0 ? [
            new Paragraph({
              text: 'Skills',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: skills.join(', ') }),
            new Paragraph({ text: '' }),
          ] : []),
          ...(certifications.length > 0 ? [
            new Paragraph({
              text: 'Certifications',
              heading: HeadingLevel.HEADING_2,
            }),
            ...certifications.flatMap(cert => [
              new Paragraph({
                children: [new TextRun({ text: cert.name, bold: true })],
              }),
              new Paragraph({ text: `${cert.issuer} - ${cert.year}` }),
            ]),
            new Paragraph({ text: '' }),
          ] : []),
          ...(projects.length > 0 ? [
            new Paragraph({
              text: 'Projects',
              heading: HeadingLevel.HEADING_2,
            }),
            ...projects.flatMap(proj => [
              new Paragraph({
                children: [new TextRun({ text: proj.name, bold: true })],
              }),
              new Paragraph({ text: proj.description }),
              new Paragraph({ text: proj.technologies, italics: true }),
              new Paragraph({ text: '' }),
            ]),
          ] : []),
          ...(awards.length > 0 ? [
            new Paragraph({
              text: 'Awards',
              heading: HeadingLevel.HEADING_2,
            }),
            ...awards.map(award => new Paragraph({
              text: `${award.title} - ${award.organization} (${award.year})`,
            })),
          ] : []),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'resume.docx');
  };

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
          background: #e9ecef;
          padding: 5px 10px;
          border-radius: 15px;
          margin: 3px;
          font-size: 12px;
          position: relative;
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
            <button className="btn btn-primary" onClick={downloadPDF}>📄 Download PDF</button>
            <button className="btn btn-secondary" onClick={downloadDocx}>📥 Download DOCX</button>
          </div>

          <div className="editor">
            {/* Template Selection */}
            <div className="section">
              <div className="section-title">Choose Template</div>
              <div className="template-carousel">
                <div className="carousel-container">
                  <div className="template-card active" onClick={() => selectTemplate('classic')}>
                    <div className="template-name">Classic</div>
                    <div className="template-preview">
                      <div style={{fontWeight: 'bold', textAlign: 'center', fontSize: '11px'}}>JOHN DOE</div>
                      <div style={{textAlign: 'center', fontSize: '8px', color: '#666'}}>Software Engineer</div>
                      <div style={{borderBottom: '1px solid #000', margin: '5px 0'}}></div>
                      <div style={{fontSize: '7px'}}>Professional summary text...</div>
                    </div>
                  </div>
                  <div className="template-card" onClick={() => selectTemplate('modern')}>
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
                  <div className="template-card" onClick={() => selectTemplate('minimal')}>
                    <div className="template-name">Minimal</div>
                    <div className="template-preview">
                      <div style={{fontWeight: 300, fontSize: '11px'}}>John Doe</div>
                      <div style={{fontSize: '7px', color: '#666', marginBottom: '5px'}}>Software Engineer</div>
                      <div style={{fontSize: '7px'}}>Clean and simple design with focus on content</div>
                    </div>
                  </div>
                  <div className="template-card" onClick={() => selectTemplate('creative')}>
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
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="text" placeholder="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
              <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {/* Professional Summary */}
            <div className="section">
              <div className="section-title">Professional Summary</div>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>

            {/* Skills */}
            <div className="section">
              <div className="section-title">Skills</div>
              <div className="skill-input-group">
                <input 
                  type="text" 
                  placeholder="Add a skill" 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <button className="add-btn" style={{width: 'auto', marginTop: 0}} onClick={addSkill}>+ Add</button>
              </div>
              <div>
                {skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    <button onClick={() => removeSkill(index)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="section">
              <div className="section-title">Professional Experience</div>
              {experiences.map((exp, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Job Title | Company, Location" 
                    value={exp.title}
                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Duration" 
                    value={exp.duration}
                    onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                  />
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
              <button className="add-btn" onClick={addExperience}>+ Add Experience</button>
            </div>

            {/* Education */}
            <div className="section">
              <div className="section-title">Education</div>
              <input type="text" placeholder="Degree" value={degree} onChange={(e) => setDegree(e.target.value)} />
              <input type="text" placeholder="Institution" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              <input type="text" placeholder="Year" value={eduYear} onChange={(e) => setEduYear(e.target.value)} />
            </div>

            {/* Certifications */}
            <div className="section">
              <div className="section-title">Certifications</div>
              {certifications.map((cert, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Certification Name" 
                    value={cert.name}
                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Issuing Organization" 
                    value={cert.issuer}
                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Year" 
                    value={cert.year}
                    onChange={(e) => updateCertification(index, 'year', e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeCertification(index)}>Remove</button>
                </div>
              ))}
              <button className="add-btn" onClick={addCertification}>+ Add Certification</button>
            </div>

            {/* Projects */}
            <div className="section">
              <div className="section-title">Projects</div>
              {projects.map((proj, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Project Name" 
                    value={proj.name}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                  />
                  <textarea 
                    placeholder="Project Description" 
                    value={proj.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Technologies Used" 
                    value={proj.technologies}
                    onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeProject(index)}>Remove</button>
                </div>
              ))}
              <button className="add-btn" onClick={addProject}>+ Add Project</button>
            </div>

            {/* Awards */}
            <div className="section">
              <div className="section-title">Awards</div>
              {awards.map((award, index) => (
                <div key={index} className="item">
                  <input 
                    type="text" 
                    placeholder="Award Title" 
                    value={award.title}
                    onChange={(e) => updateAward(index, 'title', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Issuing Organization" 
                    value={award.organization}
                    onChange={(e) => updateAward(index, 'organization', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Year" 
                    value={award.year}
                    onChange={(e) => updateAward(index, 'year', e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeAward(index)}>Remove</button>
                </div>
              ))}
              <button className="add-btn" onClick={addAward}>+ Add Award</button>
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
