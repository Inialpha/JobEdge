import filetype
import textract
import pymupdf
import tempfile
import os
import chardet


from docx import Document
from io import BytesIO

def extract_text_safe(file):
    """Safely extract text with proper encoding handling"""

    file.seek(0)
    file_type = filetype.guess(file).mime
    file_ext = file.name.split(".")[-1]

    try:
        if file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or 'wordprocessingml' in file_type or file_ext == "docx":
            doc = Document(BytesIO(file.read()))
            file.seek(0)
            return '\n'.join([p.text for p in doc.paragraphs])

        elif file_type == 'application/pdf':
            pdf = pymupdf.open(stream=filename.read())
            file_obj.seek(0)
            return '\n'.join([page.get_text() for page in pdf])

        elif file_type.startswith('text/'):
            content = file_obj.read()
            file_obj.seek(0)
            detected = chardet.detect(content)
            return content.decode(detected['encoding'] or 'utf-8', errors='replace')

        else:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                file_obj.seek(0)
                tmp.write(file_obj.read())
                tmp_path = tmp.name

            try:
                content = textract.process(tmp_path)
                detected = chardet.detect(content)
                return content.decode(detected['encoding'] or 'utf-8', errors='replace')
            finally:
                os.unlink(tmp_path)
                file_obj.seek(0)

    except Exception as e:
        print(e)
        raise Exception(f"Failed to extract text: {str(e)}")


def use_pymupdf(filename):
    doc = pymupdf.open(stream=filename.read())
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def use_textract(file):
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        file.seek(0)
        tmp.write(file.read())
        tmp_path = tmp.name
        try:
            content = textract.process(tmp_path)
            detected = chardet.detect(content)
            encoding = detected['encoding']
            text = content.decode(encoding if encoding else 'utf-8', errors='replace')


            print("text", text)
            return text
        except textract.exceptions.ShellError as e:
            print(e)
            raise e
            return None
        except Exception as e:
            print(e)
            raise e
        finally:
            os.unlink(tmp_path)
            file.seek(0)


class File:
    """ A file class """
    def __init__(self, filename):
        """ initialize a file """
        self.name = filename
        self.type = self._get_type()
        self.content = ""
        self.extention = ""
        self.text = self._get_text()

    def _get_type(self):
        try:
            return filetype.guess(self.name).mime
        except AttributeError:
            return None

    def _get_extention(self):
        try:
            return filetype.guess(self.name).extention
        except AttributeError:
            return None
    def _get_text(self):
        if self.type == "application/pdf":
            return use_pymupdf(self.name)

        if self.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return use_textract(self.name)
        else:
            res = use_textract(self.name)
            return res

