import os
import yaml
import json

def generate_tag_index(docs_dir='docs', output_file='docs/related_content.json'):
    tag_map = {} # Key: Tag Name, Value: List of {title, url}

    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if file.endswith('.md'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    try:
                        # Extract frontmatter between --- and ---
                        content = f.read()
                        if content.startswith('---'):
                            parts = content.split('---')
                            metadata = yaml.safe_load(parts[1])
                            
                            title = metadata.get('title', file.replace('.md', ''))
                            tags = metadata.get('tags', [])
                            
                            # Clean up the URL path for MkDocs
                            # e.g., docs/architecture.md -> architecture/
                            rel_path = os.path.relpath(path, docs_dir).replace('.md', '/')
                            if rel_path == 'index/': rel_path = ''
                            
                            for tag in tags:
                                if tag not in tag_map:
                                    tag_map[tag] = []
                                # Only add if not already in list (avoid duplicates)
                                if not any(p['url'] == rel_path for p in tag_map[tag]):
                                    tag_map[tag].append({
                                        "title": title,
                                        "url": "/" + rel_path.replace('\\', '/')
                                    })
                    except Exception as e:
                        print(f"Error parsing {path}: {e}")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(tag_map, f, indent=2)
    print(f"Successfully generated {output_file}")

if __name__ == "__main__":
    generate_tag_index()