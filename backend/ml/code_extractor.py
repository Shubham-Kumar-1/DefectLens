"""
Code Metrics Extractor for DefectLens
Extracts the standard 21 NASA MDP / Halstead / McCabe software metrics from source code.
Supports Python (AST-based via Radon) and multi-language lexical analysis (Java, C/C++, C#, JS/TS, etc.)
"""
import re
import math
from typing import Dict, Any, Tuple

# Operator patterns for C-family, JS, Java, Python languages
MULTI_CHAR_OPS = [
    "===", "!==", "<=>", "->*", "...", 
    "==", "!=", "<=", ">=", "&&", "||", "++", "--", 
    "<<", ">>", "+=", "-=", "*=", "/=", "%=", "&=", 
    "|=", "^=", "->", "::", "**", "//"
]

SINGLE_CHAR_OPS = set("+-*/%=<>!&|^~?:;,.()[]{}")

KEYWORDS_BRANCH = {
    "if", "elif", "for", "while", "case", "catch", "except", "with",
    "switch", "rescue", "ensure", "finally"
}

def detect_language(filename: str = "", code: str = "") -> str:
    ext = filename.lower().split(".")[-1] if "." in filename else ""
    if ext in ["py", "pyw"]:
        return "python"
    elif ext in ["java"]:
        return "java"
    elif ext in ["js", "jsx", "ts", "tsx"]:
        return "javascript"
    elif ext in ["c", "cpp", "cc", "cxx", "h", "hpp"]:
        return "c_cpp"
    elif ext in ["cs"]:
        return "csharp"
    elif ext in ["go"]:
        return "go"
    
    # Heuristics from code content
    if "def " in code and ":" in code and ("import " in code or "print(" in code):
        return "python"
    if "public class " in code or "System.out.print" in code:
        return "java"
    if "function " in code or "const " in code or "console.log" in code:
        return "javascript"
    if "#include <" in code or "std::" in code:
        return "c_cpp"
    return "generic"

def extract_python_radon(code: str) -> Dict[str, float]:
    """Extract metrics for Python using radon AST and Halstead modules."""
    import radon.raw
    import radon.complexity
    import radon.metrics

    raw = radon.raw.analyze(code)
    blocks = radon.complexity.cc_visit(code)
    hal = radon.metrics.h_visit(code)
    
    v_g = float(sum([b.complexity for b in blocks])) if blocks else 1.0
    v_g = max(1.0, v_g)
    total_h = hal.total

    h_vol = float(total_h.volume) if total_h.volume > 0 else 1.0
    h_diff = float(total_h.difficulty) if total_h.difficulty > 0 else 1.0
    h_eff = float(total_h.effort) if total_h.effort > 0 else (h_diff * h_vol)
    
    return {
        "loc": float(raw.loc),
        "v_g": float(v_g),
        "ev_g": max(1.0, round(v_g * 0.4, 2)),
        "iv_g": max(1.0, round(v_g * 0.6, 2)),
        "n": float(total_h.length),
        "v": round(h_vol, 2),
        "l": round(1.0 / h_diff, 4) if h_diff > 0 else 0.05,
        "d": round(h_diff, 2),
        "i": round(h_vol / h_diff, 2) if h_diff > 0 else 0.0,
        "e": round(h_eff, 2),
        "b": round(float(total_h.bugs), 4) if total_h.bugs > 0 else round(h_vol / 3000.0, 4),
        "t": round(float(total_h.time), 2) if total_h.time > 0 else round(h_eff / 18.0, 2),
        "lOCode": float(raw.sloc),
        "lOComment": float(raw.comments),
        "lOBlank": float(raw.blank),
        "locCodeAndComment": 0.0,
        "uniq_Op": float(total_h.h1),
        "uniq_Opnd": float(total_h.h2),
        "total_Op": float(total_h.N1),
        "total_Opnd": float(total_h.N2),
        "branchCount": max(1.0, round(v_g * 1.5, 1))
    }

def extract_multi_language_metrics(code: str, language: str = "generic") -> Dict[str, float]:
    """
    Robust multi-language lexical parser calculating:
    - LOC, SLOC, Comment Lines, Blank Lines
    - McCabe Cyclomatic Complexity v(g) & Branch count
    - Halstead Metric counts (eta1, eta2, N1, N2, Volume, Difficulty, Effort, Bugs)
    """
    lines = code.splitlines()
    loc = len(lines)
    
    sloc = 0
    comment_lines = 0
    blank_lines = 0
    code_and_comment = 0
    in_block_comment = False
    
    # Strip comments for complexity/halstead calculations
    code_without_comments = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            blank_lines += 1
            continue

        is_comment = False
        has_code = False

        if language == "python":
            if in_block_comment:
                comment_lines += 1
                if '"""' in stripped or "'''" in stripped:
                    in_block_comment = False
                continue
            elif stripped.startswith('"""') or stripped.startswith("'''"):
                if stripped.count('"""') == 1 or stripped.count("'''") == 1:
                    in_block_comment = True
                comment_lines += 1
                continue
            elif stripped.startswith("#"):
                comment_lines += 1
                continue
            else:
                has_code = True
                if "#" in stripped:
                    code_and_comment += 1
                    stripped = stripped.split("#")[0].strip()
        else:
            # C / C++ / Java / JS style comments
            if in_block_comment:
                comment_lines += 1
                if "*/" in stripped:
                    in_block_comment = False
                    rest = stripped.split("*/", 1)[1].strip()
                    if rest:
                        has_code = True
                        stripped = rest
                continue
            elif stripped.startswith("/*"):
                comment_lines += 1
                if "*/" not in stripped:
                    in_block_comment = True
                continue
            elif stripped.startswith("//"):
                comment_lines += 1
                continue
            else:
                has_code = True
                if "//" in stripped:
                    code_and_comment += 1
                    stripped = stripped.split("//")[0].strip()
                elif "/*" in stripped:
                    code_and_comment += 1
                    stripped = stripped.split("/*")[0].strip()

        if has_code:
            sloc += 1
            code_without_comments.append(stripped)

    # Cyclomatic Complexity calculation
    # Base complexity = 1
    clean_code = " \n ".join(code_without_comments)
    
    # Count decision branch keywords
    decision_count = 0
    branch_regex = r'\b(if|elif|else\s+if|for|while|case|catch|except)\b'
    decision_count += len(re.findall(branch_regex, clean_code))
    
    # Count logical operators that create decision branches
    decision_count += len(re.findall(r'(&&|\|\||\band\b|\bor\b)', clean_code))
    # Ternary operators
    decision_count += len(re.findall(r'\s\?\s', clean_code))
    
    v_g = float(decision_count + 1)
    ev_g = max(1.0, round(v_g * 0.4, 2))
    iv_g = max(1.0, round(v_g * 0.6, 2))
    branch_count = max(1.0, round(v_g * 1.5, 1))

    # Halstead Metrics Tokenizer
    operators_found = []
    operands_found = []

    # Replace string literals so their contents don't pollute operator counts
    code_no_strings = re.sub(r'("[^"\\]*(\\.[^"\\]*)*"|\'[^\'\\]*(\\.[^\'\\]*)*\')', ' _STR_ ', clean_code)

    # Extract multi-character operators first
    working_text = code_no_strings
    for op in MULTI_CHAR_OPS:
        escaped = re.escape(op)
        matches = re.findall(escaped, working_text)
        if matches:
            operators_found.extend(matches)
            working_text = re.sub(escaped, " ", working_text)

    # Extract single-character operators
    for char in working_text:
        if char in SINGLE_CHAR_OPS:
            operators_found.append(char)

    # Extract operands (identifiers and numeric literals)
    tokens = re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b|\b\d+(?:\.\d+)?\b', working_text)
    
    reserved_keywords = {
        "class", "def", "function", "return", "var", "let", "const", "int", "float", 
        "double", "void", "public", "private", "protected", "static", "import", "from",
        "new", "this", "self", "true", "false", "null", "none", "try", "throw", "throws"
    }

    for tok in tokens:
        if tok.lower() in KEYWORDS_BRANCH:
            operators_found.append(tok.lower())
        elif tok.lower() in reserved_keywords:
            operators_found.append(tok.lower())
        else:
            operands_found.append(tok)

    n1 = len(operators_found)
    n2 = len(operands_found)
    eta1 = len(set(operators_found))
    eta2 = len(set(operands_found))

    # Guardrails for minimal programs
    eta1 = max(1, eta1)
    eta2 = max(1, eta2)
    n1 = max(1, n1)
    n2 = max(1, n2)

    length = n1 + n2
    vocabulary = eta1 + eta2
    volume = length * math.log2(vocabulary) if vocabulary > 0 else 1.0
    difficulty = (eta1 / 2.0) * (n2 / float(eta2))
    difficulty = max(0.5, difficulty)
    level = 1.0 / difficulty
    effort = difficulty * volume
    bugs = volume / 3000.0
    time_sec = effort / 18.0

    return {
        "loc": float(max(1, loc)),
        "v_g": float(v_g),
        "ev_g": float(ev_g),
        "iv_g": float(iv_g),
        "n": float(length),
        "v": round(volume, 2),
        "l": round(level, 4),
        "d": round(difficulty, 2),
        "i": round(volume / difficulty, 2),
        "e": round(effort, 2),
        "b": round(bugs, 4),
        "t": round(time_sec, 2),
        "lOCode": float(max(1, sloc)),
        "lOComment": float(comment_lines),
        "lOBlank": float(blank_lines),
        "locCodeAndComment": float(code_and_comment),
        "uniq_Op": float(eta1),
        "uniq_Opnd": float(eta2),
        "total_Op": float(n1),
        "total_Opnd": float(n2),
        "branchCount": float(branch_count)
    }

def extract_features_from_source(code: str, filename: str = "") -> Tuple[Dict[str, float], Dict[str, Any]]:
    """
    Main extraction interface. Returns (features_dict, metadata_dict).
    """
    if not code or not code.strip():
        raise ValueError("Source code is empty.")

    language = detect_language(filename, code)
    features = None
    method = ""

    # If python, try radon AST analysis first
    if language == "python":
        try:
            features = extract_python_radon(code)
            method = "radon_ast"
        except Exception:
            pass

    # If not python or radon failed, use multi-language parser
    if features is None:
        features = extract_multi_language_metrics(code, language=language)
        method = "lexical_static_analysis"

    metadata = {
        "filename": filename or "source_code",
        "detected_language": language,
        "method": method,
        "total_lines": int(features.get("loc", 0)),
        "executable_code_lines": int(features.get("lOCode", 0)),
        "comment_lines": int(features.get("lOComment", 0)),
        "cyclomatic_complexity": features.get("v_g", 1.0),
        "halstead_volume": features.get("v", 0.0),
        "halstead_effort": features.get("e", 0.0)
    }

    return features, metadata
