import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.paper import Paper
from app.db.session import SessionLocal

def fetch_arxiv_papers(query: str, max_results: int = 10):
    """
    从 arXiv 抓取论文
    :param query: 搜索关键词，例如 'cat:cs.AI'
    :param max_results: 最大抓取数量
    """
    base_url = 'http://export.arxiv.org/api/query?'
    search_query = f'search_query={query}&start=0&max_results={max_results}&sortBy=submittedDate&sortOrder=descending'
    
    try:
        response = urllib.request.urlopen(base_url + search_query).read()
        root = ET.fromstring(response)
        
        # arXiv API 返回的是 Atom 格式，需要处理命名空间
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        papers = []
        for entry in root.findall('atom:entry', ns):
            # 获取标题
            title_elem = entry.find('atom:title', ns)
            title = title_elem.text.replace('\n', ' ').strip() if title_elem is not None else "No Title"
            
            # 获取摘要
            summary_elem = entry.find('atom:summary', ns)
            abstract = summary_elem.text.replace('\n', ' ').strip() if summary_elem is not None else "No Abstract"
            
            # 获取 URL (通常是 id)
            id_elem = entry.find('atom:id', ns)
            url = id_elem.text.strip() if id_elem is not None else ""
            
            # 获取发布时间
            published_elem = entry.find('atom:published', ns)
            published_str = published_elem.text.strip() if published_elem is not None else ""
            try:
                # arXiv 时间格式: 2023-10-10T10:10:10Z
                published_date = datetime.strptime(published_str, '%Y-%m-%dT%H:%M:%SZ')
            except ValueError:
                published_date = datetime.now()

            # 获取作者
            authors = []
            for author in entry.findall('atom:author', ns):
                name_elem = author.find('atom:name', ns)
                if name_elem is not None:
                    authors.append(name_elem.text.strip())
            
            paper = {
                'title': title,
                'abstract': abstract,
                'url': url,
                'published_date': published_date,
                'authors': authors,
                'source': 'arXiv'
            }
            papers.append(paper)
        
        return papers
    except Exception as e:
        print(f"Error parsing arXiv response: {e}")
        return []

def save_papers_to_db(papers: list, db: Session):
    """
    保存论文到数据库
    """
    count = 0
    for paper_data in papers:
        # 检查是否已存在
        existing_paper = db.query(Paper).filter(Paper.url == paper_data['url']).first()
        if existing_paper:
            continue
        
        paper = Paper(
            title=paper_data['title'],
            abstract=paper_data['abstract'],
            url=paper_data['url'],
            published_date=paper_data['published_date'],
            authors=paper_data['authors'],
            source=paper_data['source']
        )
        db.add(paper)
        count += 1
    
    db.commit()
    return count

if __name__ == "__main__":
    # 测试代码
    print("开始抓取 arXiv 论文...")
    papers = fetch_arxiv_papers('cat:cs.AI', 5)
    print(f"抓取到 {len(papers)} 篇论文")
    for p in papers:
        print(f"- {p['title']}")
